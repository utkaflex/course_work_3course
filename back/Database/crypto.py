from __future__ import annotations
import base64
import hashlib
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
from config import settings

def _derive_fernet_key(secret: str) -> bytes:
    digest = hashlib.sha256(secret.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)

_FERNET = Fernet(_derive_fernet_key(settings.SECRET_KEY))

def encrypt_str(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    v = value.strip()
    if v == "":
        return None
    return _FERNET.encrypt(v.encode("utf-8")).decode("utf-8")


def decrypt_str(token: Optional[str]) -> Optional[str]:
    if token is None:
        return None
    t = token.strip()
    if t == "":
        return None
    try:
        return _FERNET.decrypt(t.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        return None