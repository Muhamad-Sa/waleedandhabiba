import mimetypes
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage


def _public_local_url(path):
    base_url = getattr(settings, 'SITE_URL', '').rstrip('/')
    media_url = getattr(settings, 'MEDIA_URL', '/media/')
    if base_url:
        return f'{base_url}{media_url}{path}'
    return f'{media_url}{path}'


def _upload_to_supabase(path, png_bytes):
    supabase_url = getattr(settings, 'SUPABASE_URL', '').rstrip('/')
    supabase_key = getattr(settings, 'SUPABASE_ANON_KEY', '')
    bucket = getattr(settings, 'SUPABASE_QR_BUCKET', 'wedding-qr-codes')

    if not supabase_url or not supabase_key:
        return None

    upload_url = f'{supabase_url}/storage/v1/object/{bucket}/{path}'
    request = Request(
        upload_url,
        data=png_bytes,
        method='POST',
        headers={
            'Authorization': f'Bearer {supabase_key}',
            'apikey': supabase_key,
            'Content-Type': mimetypes.guess_type(path)[0] or 'image/png',
            'x-upsert': 'true',
        },
    )

    try:
        with urlopen(request, timeout=30):
            pass
    except (HTTPError, URLError):
        return None

    return f'{supabase_url}/storage/v1/object/public/{bucket}/{path}'


def store_qr_png(code_number, qr_code_id, png_bytes):
    path = f'qr-codes/waleed-habiba-{code_number:03d}-{qr_code_id}.png'
    supabase_url = _upload_to_supabase(path, png_bytes)
    if supabase_url:
        return supabase_url

    saved_path = default_storage.save(path, ContentFile(png_bytes))
    return _public_local_url(saved_path)
