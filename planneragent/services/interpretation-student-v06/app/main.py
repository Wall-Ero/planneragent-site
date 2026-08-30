import asyncio,json,logging,os,time
from pathlib import Path
from fastapi import FastAPI,Header,HTTPException,Request
from fastapi.responses import JSONResponse
from .contracts import enforce_byte_limit,validate_request,validate_result
from .auth import authorized
from .identity import IDENTITY,runtime_identity,verify_and_extract
from .model import InputTokenLimitExceeded,StudentEngine
logging.basicConfig(level=logging.INFO,format="%(levelname)s %(message)s"); log=logging.getLogger("student-serving")
app=FastAPI(docs_url=None,redoc_url=None,openapi_url=None); app.state.ready=False
@app.on_event("startup")
def startup():
    token=os.environ.get("STUDENT_BEARER_TOKEN","")
    if len(token)<32: raise RuntimeError("MISSING_OR_WEAK_AUTH_TOKEN")
    adapter=verify_and_extract(Path(os.environ["STUDENT_ARTIFACT_PATH"]),Path(os.environ.get("STUDENT_CACHE_ROOT",".runtime")))
    dtype=os.environ.get("STUDENT_DTYPE","bf16")
    app.state.token=token; app.state.engine=StudentEngine(adapter,IDENTITY,dtype); app.state.dtype=dtype; app.state.limit=asyncio.Semaphore(int(os.environ.get("STUDENT_MAX_CONCURRENCY","1"))); app.state.ready=True
@app.get("/health")
def health(): return {"status":"ready" if app.state.ready else "starting"}
@app.get("/v1/identity")
def identity(): return runtime_identity(app.state.dtype)
def authorize(value):
    if not authorized(value,app.state.token): raise HTTPException(401,"UNAUTHORIZED")
@app.post("/v1/interpret")
async def interpret(request:Request,authorization:str|None=Header(None)):
    authorize(authorization); maximum=int(os.environ.get("STUDENT_MAX_REQUEST_BYTES","16384"))
    body=await request.body()
    try: enforce_byte_limit(body,maximum)
    except ValueError: raise HTTPException(413,"REQUEST_TOO_LARGE")
    try: message=validate_request(json.loads(body))
    except (ValueError,json.JSONDecodeError): raise HTTPException(422,"INVALID_REQUEST_CONTRACT")
    try: await asyncio.wait_for(app.state.limit.acquire(),timeout=.001)
    except TimeoutError: raise HTTPException(429,"CONCURRENCY_LIMIT")
    started=time.monotonic()
    try:
        result=await asyncio.to_thread(app.state.engine.interpret,message); validate_result(result)
        log.info("inference_ok duration_ms=%d",(time.monotonic()-started)*1000); return result
    except InputTokenLimitExceeded: log.warning("inference_rejected error_class=INPUT_TOKEN_LIMIT_EXCEEDED"); raise HTTPException(422,"INPUT_TOKEN_LIMIT_EXCEEDED")
    except (ValueError,json.JSONDecodeError): log.warning("inference_invalid_output"); raise HTTPException(502,"INVALID_MODEL_OUTPUT")
    finally: app.state.limit.release()
@app.exception_handler(HTTPException)
async def error(_request,error): return JSONResponse({"version":1,"error":str(error.detail)},status_code=error.status_code)
