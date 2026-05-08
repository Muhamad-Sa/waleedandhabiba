import hmac
from hashlib import sha256

from django.conf import settings


TOKEN_PREFIX = 'wh'


def _qr_secret_key():
    key = getattr(settings, 'QR_SECRET_KEY', '')
    if not key:
        raise ValueError('QR_SECRET_KEY is not configured.')
    return key.encode('utf-8')


def sign_qr_code_id(qr_code_id):
    return hmac.new(
        _qr_secret_key(),
        str(qr_code_id).encode('utf-8'),
        sha256,
    ).hexdigest()


def build_qr_token(qr_code_id):
    return f'{TOKEN_PREFIX}-{qr_code_id}-{sign_qr_code_id(qr_code_id)}'


def parse_and_validate_qr_token(token):
    if not token or not isinstance(token, str):
        return None

    normalized_token = token.strip()
    if not normalized_token.startswith(f'{TOKEN_PREFIX}-'):
        return None

    try:
        payload, provided_signature = normalized_token.rsplit('-', 1)
        _, qr_code_id = payload.split(f'{TOKEN_PREFIX}-', 1)
    except ValueError:
        return None

    expected_signature = sign_qr_code_id(qr_code_id)
    if not hmac.compare_digest(provided_signature, expected_signature):
        return None

    return qr_code_id
