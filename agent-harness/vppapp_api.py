#!/usr/bin/env python3
"""FastAPI bridge server for vpp-app Command Palette.
Exposes cli_anything.vppapp.core.* functions as REST endpoints.
Start: python agent-harness/vppapp_api.py
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from cli_anything.vppapp.core import devices, tasks, market, revenue, theme, project
from cli_anything.vppapp.utils.vppapp_backend import git_deploy, git_status, run_build

app = FastAPI(title="VPP App Tool Server", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health ──────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "version": "1.0.0"}

# ── Devices ─────────────────────────────────────────────────────────
@app.get("/api/tools/devices")
def get_devices(type_filter: Optional[str] = None, status_filter: Optional[str] = None):
    return {"success": True, "data": devices.list_devices(type_filter=type_filter, status_filter=status_filter)}

@app.get("/api/tools/device_summary")
def get_device_summary():
    return {"success": True, "data": devices.device_status_summary()}

# ── Tasks ────────────────────────────────────────────────────────────
@app.get("/api/tools/tasks")
def get_tasks(type_filter: Optional[str] = None, status_filter: Optional[str] = None):
    return {"success": True, "data": tasks.list_tasks(type_filter=type_filter, status_filter=status_filter)}

@app.get("/api/tools/task_summary")
def get_task_summary():
    return {"success": True, "data": tasks.task_summary()}

# ── Market ───────────────────────────────────────────────────────────
@app.get("/api/tools/market")
def get_market():
    return {"success": True, "data": market.list_prices()}

@app.get("/api/tools/market_summary")
def get_market_summary():
    return {"success": True, "data": market.market_summary()}

@app.get("/api/tools/market_strategy")
def get_market_strategy():
    return {"success": True, "data": market.get_strategy_windows()}

# ── Revenue ──────────────────────────────────────────────────────────
@app.get("/api/tools/revenue_summary")
def get_revenue_summary():
    return {"success": True, "data": revenue.revenue_summary()}

# ── Market Write ─────────────────────────────────────────────────────
class UpdatePriceBody(BaseModel):
    hour: int
    price: float

@app.post("/api/tools/update_price")
def update_price(body: UpdatePriceBody):
    if not (0 <= body.hour <= 23):
        raise HTTPException(status_code=400, detail="hour must be 0-23")
    result = market.update_price(body.hour, price=body.price)
    return {"success": result is not None, "data": result}

class UpdateAllPricesBody(BaseModel):
    percent_change: float  # e.g. 10 means +10%, -5 means -5%

@app.post("/api/tools/update_all_prices")
def update_all_prices(body: UpdateAllPricesBody):
    prices = market.list_prices()
    updated = []
    for p in prices:
        h = int(p["hour"].split(":")[0])
        new_price = round(p["price"] * (1 + body.percent_change / 100), 4)
        result = market.update_price(h, price=new_price)
        if result:
            updated.append({"hour": p["hour"], "old": p["price"], "new": new_price})
    summary = market.market_summary()
    return {
        "success": True,
        "data": {
            "updated_count": len(updated),
            "percent_change": body.percent_change,
            "new_avg_price": summary.get("avg_price"),
            "new_max_price": summary.get("max_price"),
            "new_min_price": summary.get("min_price"),
        }
    }

# ── Theme ────────────────────────────────────────────────────────────
class SetThemeBody(BaseModel):
    mode: Optional[str] = None
    tone: Optional[str] = None

@app.post("/api/tools/set_theme")
def set_theme(body: SetThemeBody):
    try:
        result = theme.set_theme(mode=body.mode, tone=body.tone)
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# ── Deploy ───────────────────────────────────────────────────────────
class DeployBody(BaseModel):
    message: Optional[str] = None

@app.post("/api/tools/deploy")
def deploy(body: DeployBody):
    build_result = run_build()
    if not build_result["success"]:
        return {
            "success": False,
            "data": {"step": "build", "error": build_result.get("stderr", "")[:300]}
        }
    deploy_result = git_deploy(message=body.message, push=True)
    return {
        "success": deploy_result["success"],
        "data": {
            "build": {"success": True},
            "git": deploy_result.get("steps", {}),
            "committed_files": deploy_result.get("committed_files", []),
            "commit_message": deploy_result.get("commit_message"),
            "error": deploy_result.get("error"),
        }
    }

@app.get("/api/tools/git_status")
def get_git_status():
    return {"success": True, "data": git_status()}

# ── Project ──────────────────────────────────────────────────────────
@app.get("/api/tools/project_info")
def get_project_info():
    return {"success": True, "data": project.get_project_info()}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
