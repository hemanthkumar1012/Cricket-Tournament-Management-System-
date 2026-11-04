import hmac
import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

load_dotenv()
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "change-me-now")
JWT_SECRET = os.getenv("JWT_SECRET", "local-development-secret-change-before-deployment")
JWT_ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 8
bearer_scheme = HTTPBearer(auto_error=False)


def ensure_production_secrets() -> None:
    environment = os.getenv("ENVIRONMENT", "").lower()
    is_production = environment == "production" or bool(os.getenv("VERCEL"))
    weak_passwords = {"change-me-now", "change-me-before-deploy", "password", "admin"}
    weak_secrets = {
        "local-development-secret-change-before-deployment",
        "replace-with-a-random-secret-at-least-32-characters-long",
    }
    if is_production and (
        ADMIN_PASSWORD in weak_passwords
        or JWT_SECRET in weak_secrets
        or JWT_SECRET.startswith("replace-with-")
        or len(JWT_SECRET) < 32
    ):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin credentials are not configured. Set a strong ADMIN_PASSWORD and a unique JWT_SECRET (at least 32 characters).",
        )


def authenticate_admin(username: str, password: str) -> bool:
    username_ok = hmac.compare_digest(username.encode(), ADMIN_USERNAME.encode())
    password_ok = hmac.compare_digest(password.encode(), ADMIN_PASSWORD.encode())
    return username_ok and password_ok


def create_access_token(subject: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "role": "admin",
        "iat": now,
        "exp": now + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin sign-in is required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        subject = payload.get("sub")
        if subject != ADMIN_USERNAME or payload.get("role") != "admin":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid admin token")
        return subject
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
