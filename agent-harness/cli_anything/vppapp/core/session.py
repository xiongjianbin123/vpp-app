"""Session state management for VPP App CLI harness.

Manages the data store at ~/.cli-anything-vppapp/data/ and provides
helpers for loading/saving mock data.
"""

import json
import os
from pathlib import Path
from typing import Any

# Default project path
_DEFAULT_PROJECT = Path("/Users/xiongjianbin/claude-code-project/vpp-app")


def get_data_dir() -> Path:
    """Return the CLI data directory, creating it if needed."""
    d = Path.home() / ".cli-anything-vppapp" / "data"
    d.mkdir(parents=True, exist_ok=True)
    return d


def get_project_path() -> Path:
    """Return the vpp-app project root."""
    env_path = os.environ.get("VPP_APP_PATH")
    if env_path:
        return Path(env_path)
    return _DEFAULT_PROJECT


def _data_file(name: str) -> Path:
    return get_data_dir() / f"{name}.json"


def load_store(name: str, default: Any = None) -> Any:
    """Load a JSON data store by name."""
    f = _data_file(name)
    if f.exists():
        with open(f, encoding="utf-8") as fh:
            return json.load(fh)
    return default if default is not None else []


def save_store(name: str, data: Any) -> None:
    """Persist a JSON data store by name."""
    f = _data_file(name)
    with open(f, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)


def ensure_seeded(name: str, seed_fn) -> list:
    """Load store; seed with defaults if empty."""
    data = load_store(name)
    if not data:
        data = seed_fn()
        save_store(name, data)
    return data
