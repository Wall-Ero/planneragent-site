import hmac
def authorized(header,secret):
    supplied=header[7:] if header and header.startswith("Bearer ") else ""
    return hmac.compare_digest(supplied,secret)
