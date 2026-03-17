"""Spot market data management for VPP App CLI harness.

Mirrors PricePoint data from src/pages/SpotMarket/index.tsx.
Data stored at ~/.cli-anything-vppapp/data/market.json
"""

import random
from typing import Optional
from cli_anything.vppapp.core.session import ensure_seeded, save_store

STORE_NAME = "market"

PERIOD_TYPES = ["谷", "平", "峰", "尖峰"]
BASE_PRICES = {"谷": 0.183, "平": 0.542, "峰": 0.962, "尖峰": 1.248}


def _get_period(hour: int) -> str:
    if 0 <= hour < 7:
        return "谷"
    if 7 <= hour < 9:
        return "平"
    if 9 <= hour < 11:
        return "峰"
    if 11 <= hour < 14:
        return "平"
    if 14 <= hour < 17:
        return "尖峰"
    if 17 <= hour < 19:
        return "峰"
    if 19 <= hour < 21:
        return "尖峰"
    if 21 <= hour < 23:
        return "平"
    return "谷"


def _seed_market() -> list:
    """Generate a 24-hour spot market price series."""
    points = []
    for h in range(24):
        period = _get_period(h)
        base = BASE_PRICES[period]
        noise = (random.random() - 0.5) * 0.04
        forecast_noise = (random.random() - 0.5) * 0.06
        load_adj = {"尖峰": 300, "峰": 200, "谷": -150, "平": 50}[period]
        points.append({
            "hour": f"{h:02d}:00",
            "price": round(base + noise, 4),
            "period": period,
            "forecast": round(base + noise + forecast_noise, 4),
            "load": int(600 + load_adj + random.random() * 80),
        })
    return points


def _get_market() -> list:
    return ensure_seeded(STORE_NAME, _seed_market)


def list_prices(period_filter: Optional[str] = None) -> list:
    """Return 24-hour price data, optionally filtered by period."""
    data = _get_market()
    if period_filter:
        data = [p for p in data if p.get("period") == period_filter]
    return data


def get_price(hour: int) -> Optional[dict]:
    """Return price point for a specific hour (0-23)."""
    for p in _get_market():
        if p["hour"] == f"{hour:02d}:00":
            return p
    return None


def update_price(hour: int, price: Optional[float] = None,
                 forecast: Optional[float] = None) -> Optional[dict]:
    """Manually override price/forecast for a specific hour."""
    data = _get_market()
    for p in data:
        if p["hour"] == f"{hour:02d}:00":
            if price is not None:
                p["price"] = round(price, 4)
            if forecast is not None:
                p["forecast"] = round(forecast, 4)
            save_store(STORE_NAME, data)
            return p
    return None


def regenerate_prices() -> list:
    """Re-seed the 24h market data with fresh random values."""
    data = _seed_market()
    save_store(STORE_NAME, data)
    return data


def market_summary() -> dict:
    """Return peak/valley/spread statistics."""
    data = _get_market()
    prices = [p["price"] for p in data]
    by_period = {}
    for period in PERIOD_TYPES:
        pts = [p["price"] for p in data if p["period"] == period]
        by_period[period] = round(sum(pts) / len(pts), 4) if pts else 0.0
    return {
        "max_price": max(prices),
        "min_price": min(prices),
        "avg_price": round(sum(prices) / len(prices), 4),
        "peak_valley_spread": round(max(prices) - min(prices), 4),
        "by_period": by_period,
    }


def get_strategy_windows() -> list:
    """Calculate charge/discharge strategy based on current prices."""
    data = _get_market()
    price_map = {int(p["hour"].split(":")[0]): p["price"] for p in data}
    return [
        {
            "type": "charge",
            "start": 1, "end": 6,
            "avg_price": round(sum(price_map.get(h, 0.183) for h in range(1, 7)) / 6, 4),
            "label": "充电（深谷）",
            "advice": "SOC充至80%+，备战尖峰放电",
        },
        {
            "type": "discharge",
            "start": 14, "end": 17,
            "avg_price": round(sum(price_map.get(h, 1.248) for h in range(14, 17)) / 3, 4),
            "label": "放电（午间尖峰）",
            "advice": "放电至30% SOC",
        },
        {
            "type": "discharge",
            "start": 19, "end": 21,
            "avg_price": round(sum(price_map.get(h, 1.248) for h in range(19, 21)) / 2, 4),
            "label": "放电（晚间尖峰）",
            "advice": "放电至20% SOC",
        },
    ]
