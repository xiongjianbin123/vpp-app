# TEST.md — VPP App CLI Harness Test Results

## Test Suite Overview

Two test files:
- `test_core.py` — Unit tests for core modules (devices, tasks, market, revenue, theme, project, export)
- `test_full_e2e.py` — End-to-end CLI tests using Click's CliRunner

## Running Tests

```bash
cd /Users/xiongjianbin/claude-code-project/vpp-app/agent-harness
python3 -m pytest cli_anything/vppapp/tests/ -v --tb=short
```

## Test Results (Latest Run)

Run date: 2026-03-17

```
============================= 107 passed in 0.52s ==============================
```

All 107 tests passed. Zero failures, zero errors, zero skipped.

## Test Coverage by Module

| Module | Tests | Description |
|--------|-------|-------------|
| core/devices.py | 11 | CRUD: list, filter, get, add, update, remove, summary |
| core/tasks.py | 11 | CRUD: list, filter, get, add, update, cancel, remove, summary |
| core/market.py | 7 | 24h prices, filter, get/update by hour, summary, strategy, regenerate |
| core/revenue.py | 8 | Records CRUD, monthly data, settlement status, summary |
| core/theme.py | 8 | Get/set mode+tone, validation, list all, localStorage instructions |
| core/project.py | 6 | Page list/filter/get, user list (no passwords), scaffold |
| core/export.py | 6 | JSON/CSV export for each data type + export_all |
| CLI e2e (device) | 10 | Full CLI round-trips via CliRunner |
| CLI e2e (task) | 8 | Full CLI round-trips via CliRunner |
| CLI e2e (market) | 6 | Full CLI round-trips via CliRunner |
| CLI e2e (revenue) | 6 | Full CLI round-trips via CliRunner |
| CLI e2e (theme) | 5 | Full CLI round-trips via CliRunner |
| CLI e2e (build) | 2 | Status and deps (no actual npm run) |
| CLI e2e (page) | 5 | List, filter, info, scaffold (dry-run) |
| CLI e2e (export) | 3 | JSON/CSV export via CLI |

Total: ~102 test cases
