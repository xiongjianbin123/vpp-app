"""Theme configuration r/w for VPP App CLI harness.

The web app reads from localStorage keys:
  - vpp_theme: 'dark' | 'light'
  - vpp_tone:  'blue' | 'green'

The CLI maintains a config file at ~/.cli-anything-vppapp/theme.json
which documents what to set in the browser's localStorage.
"""

import json
from pathlib import Path
from typing import Optional

VALID_MODES = ["dark", "light"]
VALID_TONES = ["blue", "green"]

_CONFIG_DIR = Path.home() / ".cli-anything-vppapp"
_THEME_FILE = _CONFIG_DIR / "theme.json"

# Color reference from ThemeContext.tsx
THEME_COLORS = {
    "dark": {
        "blue":  {"primary": "#00d4ff", "bgPage": "#0a0e1a", "bgCard": "#111827", "success": "#00ff88"},
        "green": {"primary": "#00e676", "bgPage": "#080f0a", "bgCard": "#0f1f13", "success": "#69ff47"},
    },
    "light": {
        "blue":  {"primary": "#1677ff", "bgPage": "#f0f4f8", "bgCard": "#ffffff", "success": "#10b981"},
        "green": {"primary": "#16a34a", "bgPage": "#f0f7f2", "bgCard": "#ffffff", "success": "#22c55e"},
    },
}

LOCALSTORAGE_KEYS = {
    "vpp_theme": "Theme mode (dark/light)",
    "vpp_tone": "Theme tone (blue/green)",
    "vpp_auth_user": "Authenticated user JSON object",
}


def _load_theme() -> dict:
    _CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    if _THEME_FILE.exists():
        with open(_THEME_FILE, encoding="utf-8") as f:
            return json.load(f)
    return {"mode": "dark", "tone": "blue"}


def _save_theme(config: dict) -> None:
    _CONFIG_DIR.mkdir(parents=True, exist_ok=True)
    with open(_THEME_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)


def get_theme() -> dict:
    """Return current theme config."""
    cfg = _load_theme()
    mode = cfg.get("mode", "dark")
    tone = cfg.get("tone", "blue")
    colors = THEME_COLORS.get(mode, {}).get(tone, {})
    return {
        "mode": mode,
        "tone": tone,
        "colors": colors,
        "localStorage": {
            "vpp_theme": mode,
            "vpp_tone": tone,
        },
        "config_file": str(_THEME_FILE),
    }


def set_theme(
    mode: Optional[str] = None,
    tone: Optional[str] = None,
) -> dict:
    """Update theme mode and/or tone."""
    if mode is not None and mode not in VALID_MODES:
        raise ValueError(f"Invalid mode '{mode}'. Choose from: {VALID_MODES}")
    if tone is not None and tone not in VALID_TONES:
        raise ValueError(f"Invalid tone '{tone}'. Choose from: {VALID_TONES}")

    cfg = _load_theme()
    if mode is not None:
        cfg["mode"] = mode
    if tone is not None:
        cfg["tone"] = tone
    _save_theme(cfg)
    return get_theme()


def list_themes() -> list:
    """Return all available theme combinations."""
    themes = []
    for m in VALID_MODES:
        for t in VALID_TONES:
            colors = THEME_COLORS[m][t]
            themes.append({
                "mode": m,
                "tone": t,
                "primary_color": colors["primary"],
                "bg_page": colors["bgPage"],
                "description": f"{m}-{t}",
            })
    return themes


def get_localstorage_instructions(mode: str, tone: str) -> str:
    """Return browser console commands to apply theme."""
    return (
        f"localStorage.setItem('vpp_theme', '{mode}');\n"
        f"localStorage.setItem('vpp_tone', '{tone}');\n"
        f"// Then reload the page: location.reload();"
    )
