FROM nvidia/cuda:12.8.1-cudnn-runtime-ubuntu24.04
RUN apt-get update && apt-get install -y --no-install-recommends python3.12 python3-pip && rm -rf /var/lib/apt/lists/*
WORKDIR /service
COPY requirements.lock .
RUN python3.12 -m pip install --no-cache-dir --break-system-packages -r requirements.lock
COPY app ./app
RUN useradd --create-home --uid 10001 student && mkdir /runtime && chown student:student /runtime
USER student
ENV STUDENT_CACHE_ROOT=/runtime PYTHONUNBUFFERED=1
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=120s --retries=3 CMD ["python3.12","-c","import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/health',timeout=2)"]
CMD ["python3.12","-m","uvicorn","app.main:app","--host","0.0.0.0","--port","8080","--workers","1","--no-access-log"]
