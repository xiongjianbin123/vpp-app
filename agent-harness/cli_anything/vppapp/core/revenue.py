"""Revenue data management for VPP App CLI harness.

Mirrors SubsidyItem and monthly revenue data from src/pages/Revenue/index.tsx.
Data stored at ~/.cli-anything-vppapp/data/revenue.json
"""

import random
from typing import Optional
from cli_anything.vppapp.core.session import ensure_seeded, save_store

STORE_NAME = "revenue"

SUBSIDY_TYPES = ["调峰补贴", "调频补贴", "辅助服务", "备用容量"]
SETTLEMENT_STATUSES = ["已结算", "结算中", "待结算"]


def _seed_revenue() -> dict:
    """Seed with real mock data from Revenue page."""
    monthly = []
    months = ["1月", "2月", "3月", "4月", "5月", "6月",
              "7月", "8月", "9月", "10月", "11月", "12月"]
    for month in months:
        peak_rev = int((80 + random.random() * 60) * 1000)
        freq_rev = int((40 + random.random() * 30) * 1000)
        aux_rev = int((20 + random.random() * 20) * 1000)
        monthly.append({
            "month": month,
            "调峰收益": peak_rev,
            "调频收益": freq_rev,
            "辅助服务": aux_rev,
            "总收益": peak_rev + freq_rev + aux_rev,
        })

    records = [
        {"key": "1",  "date": "2026-03-13", "type": "调峰补贴",  "power": 50, "duration": 3, "unitPrice": 800,  "amount": 120000, "status": "已结算"},
        {"key": "2",  "date": "2026-03-13", "type": "调频补贴",  "power": 30, "duration": 2, "unitPrice": 1200, "amount": 72000,  "status": "已结算"},
        {"key": "3",  "date": "2026-03-12", "type": "辅助服务",  "power": 40, "duration": 4, "unitPrice": 600,  "amount": 96000,  "status": "已结算"},
        {"key": "4",  "date": "2026-03-12", "type": "调峰补贴",  "power": 45, "duration": 3, "unitPrice": 800,  "amount": 108000, "status": "结算中"},
        {"key": "5",  "date": "2026-03-11", "type": "备用容量",  "power": 20, "duration": 8, "unitPrice": 400,  "amount": 64000,  "status": "已结算"},
        {"key": "6",  "date": "2026-03-11", "type": "调频补贴",  "power": 25, "duration": 2, "unitPrice": 1200, "amount": 60000,  "status": "已结算"},
        {"key": "7",  "date": "2026-03-10", "type": "辅助服务",  "power": 35, "duration": 3, "unitPrice": 600,  "amount": 63000,  "status": "待结算"},
        {"key": "8",  "date": "2026-03-10", "type": "调峰补贴",  "power": 60, "duration": 2, "unitPrice": 800,  "amount": 96000,  "status": "已结算"},
        {"key": "9",  "date": "2026-03-09", "type": "调峰补贴",  "power": 55, "duration": 4, "unitPrice": 800,  "amount": 176000, "status": "已结算"},
        {"key": "10", "date": "2026-03-09", "type": "调频补贴",  "power": 28, "duration": 2, "unitPrice": 1200, "amount": 67200,  "status": "已结算"},
        {"key": "11", "date": "2026-03-08", "type": "辅助服务",  "power": 42, "duration": 3, "unitPrice": 600,  "amount": 75600,  "status": "已结算"},
        {"key": "12", "date": "2026-03-07", "type": "备用容量",  "power": 18, "duration": 6, "unitPrice": 400,  "amount": 43200,  "status": "已结算"},
    ]
    return {"monthly": monthly, "records": records}


def _get_revenue() -> dict:
    return ensure_seeded(STORE_NAME, _seed_revenue)


def list_records(
    type_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
) -> list:
    """Return subsidy records with optional filters."""
    data = _get_revenue()
    records = data.get("records", [])
    if type_filter:
        records = [r for r in records if r.get("type") == type_filter]
    if status_filter:
        records = [r for r in records if r.get("status") == status_filter]
    if date_from:
        records = [r for r in records if r.get("date", "") >= date_from]
    if date_to:
        records = [r for r in records if r.get("date", "") <= date_to]
    return records


def get_monthly() -> list:
    """Return monthly revenue breakdown."""
    return _get_revenue().get("monthly", [])


def add_record(
    date: str,
    subsidy_type: str,
    power: float,
    duration: float,
    unit_price: float,
    status: str = "待结算",
) -> dict:
    """Add a new subsidy/revenue record."""
    if subsidy_type not in SUBSIDY_TYPES:
        raise ValueError(f"Invalid type '{subsidy_type}'. Choose from: {SUBSIDY_TYPES}")
    if status not in SETTLEMENT_STATUSES:
        raise ValueError(f"Invalid status '{status}'. Choose from: {SETTLEMENT_STATUSES}")

    data = _get_revenue()
    records = data.get("records", [])
    next_key = str(max(int(r["key"]) for r in records) + 1) if records else "1"

    record = {
        "key": next_key,
        "date": date,
        "type": subsidy_type,
        "power": power,
        "duration": duration,
        "unitPrice": unit_price,
        "amount": int(power * duration * unit_price),
        "status": status,
    }
    records.append(record)
    data["records"] = records
    save_store(STORE_NAME, data)
    return record


def update_record_status(key: str, status: str) -> Optional[dict]:
    """Update settlement status of a record."""
    if status not in SETTLEMENT_STATUSES:
        raise ValueError(f"Invalid status '{status}'")
    data = _get_revenue()
    for r in data.get("records", []):
        if r["key"] == key:
            r["status"] = status
            save_store(STORE_NAME, data)
            return r
    return None


def revenue_summary() -> dict:
    """Return aggregated revenue statistics."""
    records = list_records()
    monthly = get_monthly()
    total_monthly = sum(m.get("总收益", 0) for m in monthly)
    settled = sum(r.get("amount", 0) for r in records if r.get("status") == "已结算")
    settling = sum(r.get("amount", 0) for r in records if r.get("status") == "结算中")
    pending = sum(r.get("amount", 0) for r in records if r.get("status") == "待结算")
    return {
        "total_monthly_revenue": total_monthly,
        "settled": settled,
        "settling": settling,
        "pending": pending,
        "record_count": len(records),
    }
