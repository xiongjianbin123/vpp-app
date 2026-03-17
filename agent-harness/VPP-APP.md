# VPP-APP.md — Standard Operating Procedure

## Overview

This document describes standard operating procedures for using the `cli-anything-vppapp` CLI harness to manage the VPP App (虚拟电厂管理平台).

## Project Context

- **App**: Virtual Power Plant management platform
- **Tech Stack**: React 19 + TypeScript + Vite + Ant Design 6 + Recharts + React Router v7
- **Deployment**: GitHub Pages (HashRouter)
- **Project Path**: `/Users/xiongjianbin/claude-code-project/vpp-app`
- **Data Mode**: All data is mock (no real backend); CLI manages JSON stores at `~/.cli-anything-vppapp/data/`

## Installation

```bash
cd /Users/xiongjianbin/claude-code-project/vpp-app/agent-harness
pip install -e .
which cli-anything-vppapp   # Verify installed
```

## Common Agent Workflows

### 1. Initial Inspection

```bash
cli-anything-vppapp status --json
cli-anything-vppapp device list --json
cli-anything-vppapp task list --json
```

### 2. Device Management

```bash
# List all online grid-storage devices
cli-anything-vppapp device list --type 电网储能 --status 在线 --json

# Update SOC after charging cycle
cli-anything-vppapp device update E001 --soc 90 --json

# Add new device
cli-anything-vppapp device add \
  --name "新站储能" \
  --type 电网储能 \
  --capacity 200 \
  --location "广州市天河区" \
  --energy-capacity 400 \
  --json

# Check fleet status
cli-anything-vppapp device status --json
```

### 3. Demand Response Task Management

```bash
# View active tasks
cli-anything-vppapp task list --status 执行中 --json

# Create a new peak-shaving task
cli-anything-vppapp task add \
  --name "明日调峰任务" \
  --type 调峰 \
  --target-power 80 \
  --start "2026-03-18 09:00" \
  --end "2026-03-18 12:00" \
  --reward 200000 \
  --json

# Advance task to in-progress
cli-anything-vppapp task update T006 --status 执行中 --progress 0 --json

# Complete a task
cli-anything-vppapp task update T006 --status 已完成 --progress 100 --json
```

### 4. Spot Market Analysis

```bash
# Get current price curve
cli-anything-vppapp market prices --json

# Check arbitrage windows
cli-anything-vppapp market strategy --json

# Get market summary stats
cli-anything-vppapp market summary --json

# Simulate tomorrow's high-price scenario
cli-anything-vppapp market set-price 14 --price 1.45 --json
cli-anything-vppapp market set-price 19 --price 1.38 --json
```

### 5. Revenue Analysis

```bash
# View recent settlements
cli-anything-vppapp revenue records --status 待结算 --json

# Settle pending records
cli-anything-vppapp revenue settle 7 --status 已结算 --json

# View monthly breakdown
cli-anything-vppapp revenue monthly --json

# Revenue summary
cli-anything-vppapp revenue summary --json
```

### 6. Theme Control

```bash
# Switch to dark+green (energy theme)
cli-anything-vppapp theme set --mode dark --tone green --json

# Switch to light mode
cli-anything-vppapp theme set --mode light --json

# View browser console commands to apply
cli-anything-vppapp theme get
```

### 7. Build Management

```bash
# Check build dependencies
cli-anything-vppapp build deps --json

# Run build
cli-anything-vppapp build run --json

# Check build status
cli-anything-vppapp build status --json
```

### 8. Export Data

```bash
# Export everything for analysis
cli-anything-vppapp export all --format json --output /tmp/vpp-export/

# Export as CSV for Excel
cli-anything-vppapp export all --format csv --output ./reports/
```

### 9. Page Scaffolding

```bash
# List pages accessible to ops_manager
cli-anything-vppapp page list --role ops_manager --json

# Scaffold a new page (dry run)
cli-anything-vppapp page scaffold RealTime --route /real-time --description "实时监控页面"

# Write the file
cli-anything-vppapp page scaffold RealTime --route /real-time --description "实时监控页面" --write
```

## Data Structures Reference

### Device
```json
{
  "id": "E001",
  "name": "富山站储能",
  "type": "电网储能",
  "status": "在线",
  "capacity": 150,
  "energyCapacity": 300,
  "currentPower": 86.4,
  "soc": 65,
  "soh": 97,
  "location": "广州市番禺区石壁街道",
  "lastUpdate": "2026-03-16 10:30:00"
}
```

### Demand Response Task
```json
{
  "id": "T001",
  "name": "高峰调峰任务-01",
  "type": "调峰",
  "status": "执行中",
  "targetPower": 50,
  "currentPower": 42.3,
  "startTime": "2026-03-14 09:00",
  "endTime": "2026-03-14 12:00",
  "progress": 65,
  "reward": 125000
}
```

### Market Price Point
```json
{
  "hour": "14:00",
  "period": "尖峰",
  "price": 1.2480,
  "forecast": 1.2390,
  "load": 892
}
```

### Revenue Record
```json
{
  "key": "1",
  "date": "2026-03-13",
  "type": "调峰补贴",
  "power": 50,
  "duration": 3,
  "unitPrice": 800,
  "amount": 120000,
  "status": "已结算"
}
```

## Roles Reference

| Role Key | Label | Key Permissions |
|----------|-------|-----------------|
| sales_gm | 售电总经理 | Full access |
| sales_manager | 售电销售经理 | Devices, Revenue, Knowledge |
| trading_director | 电力交易总监 | All market/trading pages |
| trading_manager | 电力交易经理 | SpotMarket, SmartBidding |
| ops_manager | 运维经理 | Devices, DemandResponse, Compliance |
