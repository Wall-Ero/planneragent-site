"""Persistent entry point; reuse the qualified Run-2 engine and HTTP contract."""
import os
from contextlib import asynccontextmanager
from pathlib import Path
from tempfile import TemporaryDirectory

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from . import main
from .auth import authorized


def validate_configuration():
    token = os.environ.get("STUDENT_BEARER_TOKEN", "")
    if len(token) < 32 or not token.isascii() or any(ord(c) < 33 or ord(c) > 126 for c in token):
        raise ValueError("INVALID_AUTH_CONFIGURATION")
    for name in ("STUDENT_ARTIFACT_PATH", "STUDENT_CACHE_ROOT", "HF_HOME"):
        value = os.environ.get(name, "")
        if not value or not Path(value).is_absolute():
            raise ValueError("INVALID_PATH_CONFIGURATION")
    if not Path(os.environ["STUDENT_ARTIFACT_PATH"]).is_file():
        raise ValueError("ARTIFACT_MISSING")
    if os.environ.get("STUDENT_DTYPE", "bf16") != "bf16":
        raise ValueError("UNSUPPORTED_CONFIGURED_DTYPE")
    if os.environ.get("STUDENT_MAX_CONCURRENCY", "1") != "1":
        raise ValueError("INVALID_CONCURRENCY_CONFIGURATION")
    maximum = os.environ.get("STUDENT_MAX_REQUEST_BYTES", "16384")
    if not maximum.isascii() or not maximum.isdecimal() or not 1 <= int(maximum) <= 16384:
        raise ValueError("INVALID_REQUEST_LIMIT_CONFIGURATION")


@asynccontextmanager
async def lifespan(_app):
    main.app.state.ready = False
    cache = None
    original_cache = os.environ.get("STUDENT_CACHE_ROOT")
    try:
        try:
            validate_configuration()
            root = Path(original_cache)
            root.mkdir(parents=True, exist_ok=True)
            Path(os.environ["HF_HOME"]).mkdir(parents=True, exist_ok=True)
            # Re-extract verified bytes on every start; never trust an old adapter cache.
            cache = TemporaryDirectory(prefix="student-", dir=root)
            os.environ["STUDENT_CACHE_ROOT"] = cache.name
            main.startup()
        except Exception:
            # Third-party exceptions can contain credentials; suppress their context.
            raise RuntimeError("PERSISTENT_STUDENT_STARTUP_FAILED") from None
        yield
    finally:
        main.app.state.ready = False
        if original_cache is not None:
            os.environ["STUDENT_CACHE_ROOT"] = original_cache
        if cache is not None:
            cache.cleanup()


app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)


@app.middleware("http")
async def protect(request: Request, call_next):
    if not main.app.state.ready:
        return JSONResponse({"version": 1, "error": "NOT_READY"}, status_code=503)
    try:
        valid = authorized(request.headers.get("authorization"), main.app.state.token)
    except (TypeError, UnicodeError):
        valid = False
    if not valid:
        return JSONResponse({"version": 1, "error": "UNAUTHORIZED"}, status_code=401)
    try:
        return await call_next(request)
    except Exception:
        return JSONResponse({"version": 1, "error": "INFERENCE_FAILED"}, status_code=503)


@app.get("/health")
def health():
    return main.health()


@app.get("/v1/identity")
def identity():
    # GCC-5D requires this discriminator in addition to the unchanged qualified pins.
    return {**main.identity(), "protocol_version": "PA_STUDENT_HTTP_V1"}


app.add_api_route("/v1/interpret", main.interpret, methods=["POST"])
app.add_exception_handler(main.HTTPException, main.error)
