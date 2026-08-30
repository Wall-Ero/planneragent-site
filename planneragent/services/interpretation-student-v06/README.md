# GCC-4Y physical student serving foundation

This is an isolated, replaceable HTTP inference service for the frozen GCC-4X provider contract. It neither routes production traffic nor enables shadow execution.

Before model load, it verifies the immutable archive's size and SHA-256, candidate, qualification, adapter digest, base model, and revision. Only `final-adapter/adapter/` is extracted to `STUDENT_CACHE_ROOT`; mount the source ZIP read-only and never bake it into the image.

```sh
docker build -t planneragent/student-v06:foundation services/interpretation-student-v06
docker run --rm --gpus all -p 127.0.0.1:8080:8080 \
  -e STUDENT_BEARER_TOKEN='<at-least-32-random-characters>' \
  -e STUDENT_ARTIFACT_PATH=/artifacts/student.zip \
  -v "$PWD/core/training-artifacts/gcc4w/PA-INTERPRETATION-STUDENT-v0.6-GCC4W.zip:/artifacts/student.zip:ro" \
  -v student-v06-cache:/runtime planneragent/student-v06:foundation
```

This requires NVIDIA Container Toolkit and outbound Hugging Face access for the exact pinned base revision. The qualified evidence reports BF16 on a Tesla T4, but T4 (compute capability 7.5) lacks native BF16 Tensor Core support. Serving preserves BF16 while requiring `torch.cuda.is_bf16_supported()` and compute capability 8.0 or newer. Any `STUDENT_DTYPE` other than `bf16` fails startup; there is no fallback. Use at least 4 GB VRAM and 8 GB system RAM on an Ampere-or-newer GPU.

`POST /v1/interpret` requires bearer authorization. `/health` and `/v1/identity` expose only readiness and non-secret identity, including effective dtype. The 16 KiB request limit is an outer resource gate, not model eligibility: both byte and token gates must pass.

The 384-token contract covers the complete input plus output sequence. The complete frozen prompt is tokenized with truncation disabled. Input tokens plus the fixed 192-token generation budget must be no more than 384. Otherwise the service returns `INPUT_TOKEN_LIMIT_EXCEEDED`; it never clips or summarizes because `TRUNCATED_REQUESTER_CONTENT_CANNOT_BE_TREATED_AS_THE_ORIGINAL_REQUEST.`

Concurrency defaults to one with no application queue. Configure the Core timeout below the infrastructure timeout. GPU kernels cannot be safely cancelled midway, so a timed-out upstream request does not create an application retry.

Application logs contain outcome and latency only—never request, prompt, output, credentials, or tokens. Deployment proxies must also disable body logging.
