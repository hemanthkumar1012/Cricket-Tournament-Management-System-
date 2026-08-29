import importlib.util
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "python-backend"
MAIN_PATH = BACKEND_DIR / "main.py"

for candidate in (str(ROOT), str(BACKEND_DIR)):
    if candidate not in sys.path:
        sys.path.insert(0, candidate)

try:
    from main import app  # noqa: E402
except ModuleNotFoundError:
    spec = importlib.util.spec_from_file_location("backend_main", MAIN_PATH)
    if spec is None or spec.loader is None:
        raise ImportError(f"Unable to load FastAPI app from {MAIN_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    app = module.app

__all__ = ["app"]
