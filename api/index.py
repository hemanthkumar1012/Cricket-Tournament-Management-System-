"""Vercel entry point for the FastAPI application."""

import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1] / "python-backend"
sys.path.insert(0, str(BACKEND_DIR))

from main import app  # noqa: E402

__all__ = ["app"]
