# SKILL: cli-anything-vppapp

## Overview

`cli-anything-vppapp` is a CLI harness for the VPP App (虚拟电厂管理平台 — Virtual Power Plant management platform). It provides AI agents direct command-line control over mock data, theme configuration, build pipeline, and page scaffolding.

## Installation

```bash
cd /Users/xiongjianbin/claude-code-project/vpp-app/agent-harness
pip install -e .
```

## Quick Start

```bash
cli-anything-vppapp                    # Enter REPL mode
cli-anything-vppapp status             # Overall app status
cli-anything-vppapp device list --json # JSON output for agents
```

## Command Groups

### device — Device Asset Management

```bash
cli-anything-vppapp device list                          # List all devices
cli-anything-vppapp device list --type 电网储能           # Filter by type
cli-anything-vppapp device list --status 在线            # Filter by status
cli-anything-vppapp device get E001                      # Get device details
cli-anything-vppapp device add --name "Battery-01" --type 储能系统 --capacity 100 --location "Beijing"
cli-anything-vppapp device update E001 --soc 85 --status 在线
cli-anything-vppapp device remove D009
cli-anything-vppapp device status                        # Fleet summary
```

Valid types: `光伏电站`, `储能系统`, `风电`, `充电桩`, `工业负荷`, `电网储能`
Valid statuses: `在线`, `离线`, `维护`, `告警`

### task — Demand Response Task Management

```bash
cli-anything-vppapp task list                            # All tasks
cli-anything-vppapp task list --type 调峰 --status 执行中
cli-anything-vppapp task get T001
cli-anything-vppapp task add --name "Peak Task" --type 调峰 --target-power 50 --start "2026-03-17 09:00" --end "2026-03-17 12:00" --reward 100000
cli-anything-vppapp task update T002 --status 执行中 --progress 30
cli-anything-vppapp task cancel T005
cli-anything-vppapp task summary
```

Valid types: `调峰`, `调频`, `备用`
Valid statuses: `待响应`, `执行中`, `已完成`, `已取消`

### market — Spot Market Data

```bash
cli-anything-vppapp market prices                        # 24h price table
cli-anything-vppapp market prices --period 尖峰          # Filter by period
cli-anything-vppapp market summary                       # Price statistics
cli-anything-vppapp market strategy                      # Arbitrage windows
cli-anything-vppapp market regenerate                    # Fresh random prices
cli-anything-vppapp market set-price 14 --price 1.35     # Override hour 14 price
```

Valid periods: `谷`, `平`, `峰`, `尖峰`
Base prices: 谷=0.183, 平=0.542, 峰=0.962, 尖峰=1.248 ¥/kWh

### revenue — Revenue & Settlement

```bash
cli-anything-vppapp revenue records                      # All records
cli-anything-vppapp revenue records --type 调峰补贴 --status 已结算
cli-anything-vppapp revenue monthly                      # Monthly breakdown
cli-anything-vppapp revenue add --date 2026-03-17 --type 调峰补贴 --power 50 --duration 3 --unit-price 800
cli-anything-vppapp revenue settle 7 --status 已结算
cli-anything-vppapp revenue summary
```

Valid types: `调峰补贴`, `调频补贴`, `辅助服务`, `备用容量`
Valid statuses: `已结算`, `结算中`, `待结算`

### theme — Theme Configuration

```bash
cli-anything-vppapp theme get                            # Current theme
cli-anything-vppapp theme set --mode dark --tone green   # Set dark+green
cli-anything-vppapp theme set --mode light --tone blue   # Set light+blue
cli-anything-vppapp theme list                           # All combinations
```

The CLI saves config to `~/.cli-anything-vppapp/theme.json`. To apply in browser:
```javascript
localStorage.setItem('vpp_theme', 'dark');
localStorage.setItem('vpp_tone', 'green');
location.reload();
```

### build — npm Build Pipeline

```bash
cli-anything-vppapp build run                            # npm run build
cli-anything-vppapp build lint                           # npm run lint
cli-anything-vppapp build status                         # Check dist/ dir
cli-anything-vppapp build deps                           # Check node/npm/node_modules
```

### page — Page Management

```bash
cli-anything-vppapp page list                            # All pages
cli-anything-vppapp page list --role ops_manager         # Pages for role
cli-anything-vppapp page info Dashboard                  # Page details
cli-anything-vppapp page scaffold NewPage --route /new-page --description "My page"
cli-anything-vppapp page scaffold NewPage --route /new-page --write  # Write file
```

### export — Data Export

```bash
cli-anything-vppapp export all --format json --output ./export/
cli-anything-vppapp export all --format csv  --output ./export/
cli-anything-vppapp export devices
cli-anything-vppapp export tasks
cli-anything-vppapp export market
cli-anything-vppapp export revenue
```

## Data Storage

All mock data is persisted at `~/.cli-anything-vppapp/data/`:
- `devices.json` — Device assets
- `tasks.json`   — Demand response tasks
- `market.json`  — Spot market prices
- `revenue.json` — Revenue records

Theme config: `~/.cli-anything-vppapp/theme.json`

## JSON Output Mode

Add `--json` to any command for machine-readable output:

```bash
cli-anything-vppapp device list --json
# Returns: {"success": true, "data": {"devices": [...], "count": N}}

cli-anything-vppapp device add --name X --type 储能系统 --capacity 100 --location Y --json
# Returns: {"success": true, "data": {...device object...}}
```

## Environment Variables

- `VPP_APP_PATH` — Override project root path (default: `/Users/xiongjianbin/claude-code-project/vpp-app`)

## App Architecture Reference

Pages: Dashboard, Devices, DemandResponse, SpotMarket, SmartBidding, ComplianceControl, Revenue, KnowledgeBase, InvestmentCalculator

Roles: `sales_gm`, `sales_manager`, `trading_director`, `trading_manager`, `ops_manager`

Mock users:
- admin/admin123 — 售电总经理 (full access)
- trading/trade123 — 电力交易总监
- ops/ops123 — 运维经理

## Agent Usage Pattern

For AI agents, the recommended pattern is:
1. Check status: `cli-anything-vppapp status --json`
2. Read data: `cli-anything-vppapp device list --json`
3. Modify data: `cli-anything-vppapp device update E001 --soc 90 --json`
4. Export for analysis: `cli-anything-vppapp export all --format json --output /tmp/vpp-export/`
