# cli-anything-vppapp

CLI harness for **VPP App** (虚拟电厂管理平台 — Virtual Power Plant management platform).

Makes the React + Vite web app "agent-native" — AI agents can control and manage it via command line.

## Install

```bash
cd /Users/xiongjianbin/claude-code-project/vpp-app/agent-harness
pip install -e .
```

## Usage

```bash
cli-anything-vppapp                              # REPL mode (default)
cli-anything-vppapp status --json                # App status (JSON)
cli-anything-vppapp device list --json           # List devices
cli-anything-vppapp device add --name "Bat-01" --type 储能系统 --capacity 100 --location "Beijing"
cli-anything-vppapp theme set --mode dark --tone green
cli-anything-vppapp build run --json             # npm run build
cli-anything-vppapp export all --format json     # Export all data
```

See `skills/SKILL.md` for full command reference.

## Architecture

```
cli_anything/vppapp/
├── vppapp_cli.py        # Main Click CLI + REPL
├── core/
│   ├── devices.py       # Device CRUD
│   ├── tasks.py         # Demand response task CRUD
│   ├── market.py        # Spot market price data
│   ├── revenue.py       # Revenue records
│   ├── theme.py         # Theme config r/w
│   ├── export.py        # JSON/CSV export
│   ├── project.py       # Page listing, build status, scaffolding
│   └── session.py       # Data store at ~/.cli-anything-vppapp/
├── utils/
│   ├── vppapp_backend.py  # npm subprocess wrapper
│   └── repl_skin.py       # Unified REPL UI (cli-anything standard)
├── skills/SKILL.md        # Agent discovery document
└── tests/
    ├── test_core.py       # Unit tests
    └── test_full_e2e.py   # CLI e2e tests
```
