"""Export mock data to JSON/CSV for analysis.

Supports exporting devices, tasks, market prices, and revenue records.
"""

import csv
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Optional


def _ensure_output_dir(output_dir: str) -> Path:
    path = Path(output_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _timestamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def export_json(data: dict, output_dir: str, filename: str) -> str:
    """Export data dict to a JSON file. Returns file path."""
    out = _ensure_output_dir(output_dir)
    fp = out / filename
    with open(fp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return str(fp)


def export_csv(rows: list, headers: list, output_dir: str, filename: str) -> str:
    """Export rows to CSV file. Returns file path."""
    out = _ensure_output_dir(output_dir)
    fp = out / filename
    with open(fp, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        for row in rows:
            writer.writerow(row)
    return str(fp)


def export_devices(output_dir: str = "./export", fmt: str = "json") -> str:
    """Export device data."""
    from cli_anything.vppapp.core.devices import list_devices
    devices = list_devices()
    ts = _timestamp()

    if fmt == "json":
        return export_json(
            {"exported_at": ts, "count": len(devices), "devices": devices},
            output_dir, f"devices_{ts}.json"
        )
    else:
        headers = ["id", "name", "type", "status", "capacity", "currentPower",
                   "location", "soc", "soh", "investmentCost", "lastUpdate"]
        rows = [
            [d.get(h, "") for h in headers]
            for d in devices
        ]
        return export_csv(rows, headers, output_dir, f"devices_{ts}.csv")


def export_tasks(output_dir: str = "./export", fmt: str = "json") -> str:
    """Export demand response task data."""
    from cli_anything.vppapp.core.tasks import list_tasks
    tasks = list_tasks()
    ts = _timestamp()

    if fmt == "json":
        return export_json(
            {"exported_at": ts, "count": len(tasks), "tasks": tasks},
            output_dir, f"tasks_{ts}.json"
        )
    else:
        headers = ["id", "name", "type", "status", "targetPower", "currentPower",
                   "startTime", "endTime", "progress", "reward"]
        rows = [[t.get(h, "") for h in headers] for t in tasks]
        return export_csv(rows, headers, output_dir, f"tasks_{ts}.csv")


def export_market(output_dir: str = "./export", fmt: str = "json") -> str:
    """Export spot market price data."""
    from cli_anything.vppapp.core.market import list_prices, market_summary
    prices = list_prices()
    ts = _timestamp()

    if fmt == "json":
        return export_json(
            {
                "exported_at": ts,
                "count": len(prices),
                "summary": market_summary(),
                "prices": prices,
            },
            output_dir, f"market_{ts}.json"
        )
    else:
        headers = ["hour", "period", "price", "forecast", "load"]
        rows = [[p.get(h, "") for h in headers] for p in prices]
        return export_csv(rows, headers, output_dir, f"market_{ts}.csv")


def export_revenue(output_dir: str = "./export", fmt: str = "json") -> str:
    """Export revenue records and monthly data."""
    from cli_anything.vppapp.core.revenue import list_records, get_monthly, revenue_summary
    records = list_records()
    monthly = get_monthly()
    ts = _timestamp()

    if fmt == "json":
        return export_json(
            {
                "exported_at": ts,
                "summary": revenue_summary(),
                "monthly": monthly,
                "records": records,
            },
            output_dir, f"revenue_{ts}.json"
        )
    else:
        headers = ["key", "date", "type", "power", "duration", "unitPrice", "amount", "status"]
        rows = [[r.get(h, "") for h in headers] for r in records]
        return export_csv(rows, headers, output_dir, f"revenue_{ts}.csv")


def export_all(output_dir: str = "./export", fmt: str = "json") -> list:
    """Export all data stores. Returns list of created file paths."""
    files = []
    files.append(export_devices(output_dir, fmt))
    files.append(export_tasks(output_dir, fmt))
    files.append(export_market(output_dir, fmt))
    files.append(export_revenue(output_dir, fmt))
    return files
