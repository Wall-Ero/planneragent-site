"""Authenticated local readiness probe; never print credentials or response bodies."""
import http.client
import json
import os
import sys


def ready():
    try:
        connection = http.client.HTTPConnection("127.0.0.1", 8080, timeout=2)
        try:
            connection.request("GET", "/health", headers={
                "Authorization": "Bearer " + os.environ["STUDENT_BEARER_TOKEN"]
            })
            response = connection.getresponse()
            return response.status == 200 and json.loads(response.read()) == {"status": "ready"}
        finally:
            connection.close()
    except Exception:
        return False


if __name__ == "__main__":
    sys.exit(0 if ready() else 1)
