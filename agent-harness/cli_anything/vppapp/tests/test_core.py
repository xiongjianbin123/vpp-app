"""Unit tests for VPP App CLI harness core modules.

Tests CRUD operations for devices, tasks, market, revenue,
theme config, project info, and export functionality.
"""

import json
import os
import pytest
import tempfile
from pathlib import Path
from unittest.mock import patch


# ──────────────────────────────────────────────────────────────────────
# Fixture: Temporary data directory
# ──────────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def temp_data_dir(tmp_path, monkeypatch):
    """Redirect CLI data store to a temp directory for each test."""
    data_dir = tmp_path / ".cli-anything-vppapp" / "data"
    data_dir.mkdir(parents=True)
    theme_dir = tmp_path / ".cli-anything-vppapp"

    # Patch get_data_dir and home
    import cli_anything.vppapp.core.session as session_mod
    import cli_anything.vppapp.core.theme as theme_mod

    monkeypatch.setattr(session_mod, "get_data_dir", lambda: data_dir)
    monkeypatch.setattr(
        theme_mod, "_CONFIG_DIR", theme_dir
    )
    monkeypatch.setattr(
        theme_mod, "_THEME_FILE", theme_dir / "theme.json"
    )
    return tmp_path


# ──────────────────────────────────────────────────────────────────────
# Devices tests
# ──────────────────────────────────────────────────────────────────────

class TestDevices:
    def test_list_devices_seeded(self):
        from cli_anything.vppapp.core.devices import list_devices
        devices = list_devices()
        assert len(devices) > 0
        assert all("id" in d and "name" in d and "type" in d for d in devices)

    def test_list_devices_filter_type(self):
        from cli_anything.vppapp.core.devices import list_devices
        devices = list_devices(type_filter="电网储能")
        assert all(d["type"] == "电网储能" for d in devices)
        assert len(devices) > 0

    def test_list_devices_filter_status(self):
        from cli_anything.vppapp.core.devices import list_devices
        devices = list_devices(status_filter="在线")
        assert all(d["status"] == "在线" for d in devices)

    def test_get_device_found(self):
        from cli_anything.vppapp.core.devices import get_device
        d = get_device("E001")
        assert d is not None
        assert d["id"] == "E001"
        assert d["name"] == "富山站储能"

    def test_get_device_not_found(self):
        from cli_anything.vppapp.core.devices import get_device
        d = get_device("NONEXISTENT")
        assert d is None

    def test_add_device(self):
        from cli_anything.vppapp.core.devices import add_device, get_device
        d = add_device(
            name="Test Battery",
            device_type="储能系统",
            capacity=50.0,
            location="Test Location",
        )
        assert d["name"] == "Test Battery"
        assert d["type"] == "储能系统"
        assert d["capacity"] == 50.0
        assert "id" in d

        # Verify persisted
        found = get_device(d["id"])
        assert found is not None
        assert found["name"] == "Test Battery"

    def test_add_device_invalid_type(self):
        from cli_anything.vppapp.core.devices import add_device
        with pytest.raises(ValueError, match="Invalid type"):
            add_device("X", "InvalidType", 10, "Loc")

    def test_add_device_invalid_status(self):
        from cli_anything.vppapp.core.devices import add_device
        with pytest.raises(ValueError, match="Invalid status"):
            add_device("X", "储能系统", 10, "Loc", status="InvalidStatus")

    def test_update_device(self):
        from cli_anything.vppapp.core.devices import update_device, get_device
        result = update_device("E001", soc=90, status="维护")
        assert result is not None
        assert result["soc"] == 90
        assert result["status"] == "维护"

        # Verify persisted
        d = get_device("E001")
        assert d["soc"] == 90

    def test_update_device_not_found(self):
        from cli_anything.vppapp.core.devices import update_device
        result = update_device("NONEXISTENT", soc=50)
        assert result is None

    def test_remove_device(self):
        from cli_anything.vppapp.core.devices import remove_device, get_device
        removed = remove_device("E001")
        assert removed is True
        assert get_device("E001") is None

    def test_remove_device_not_found(self):
        from cli_anything.vppapp.core.devices import remove_device
        removed = remove_device("NONEXISTENT")
        assert removed is False

    def test_device_status_summary(self):
        from cli_anything.vppapp.core.devices import device_status_summary
        summary = device_status_summary()
        assert "total" in summary
        assert "在线" in summary
        assert "total_capacity_mw" in summary
        assert summary["total"] > 0
        assert summary["total_capacity_mw"] > 0


# ──────────────────────────────────────────────────────────────────────
# Tasks tests
# ──────────────────────────────────────────────────────────────────────

class TestTasks:
    def test_list_tasks_seeded(self):
        from cli_anything.vppapp.core.tasks import list_tasks
        tasks = list_tasks()
        assert len(tasks) == 5
        assert all("id" in t and "type" in t and "status" in t for t in tasks)

    def test_list_tasks_filter_type(self):
        from cli_anything.vppapp.core.tasks import list_tasks
        tasks = list_tasks(type_filter="调峰")
        assert all(t["type"] == "调峰" for t in tasks)
        assert len(tasks) >= 1

    def test_list_tasks_filter_status(self):
        from cli_anything.vppapp.core.tasks import list_tasks
        tasks = list_tasks(status_filter="待响应")
        assert all(t["status"] == "待响应" for t in tasks)

    def test_get_task_found(self):
        from cli_anything.vppapp.core.tasks import get_task
        t = get_task("T001")
        assert t is not None
        assert t["name"] == "高峰调峰任务-01"

    def test_get_task_not_found(self):
        from cli_anything.vppapp.core.tasks import get_task
        assert get_task("NONEXISTENT") is None

    def test_add_task(self):
        from cli_anything.vppapp.core.tasks import add_task, get_task
        t = add_task(
            name="New Peak Task",
            task_type="调峰",
            target_power=60.0,
            start_time="2026-03-17 09:00",
            end_time="2026-03-17 12:00",
            reward=150000,
        )
        assert t["name"] == "New Peak Task"
        assert t["targetPower"] == 60.0
        assert t["reward"] == 150000
        assert t["status"] == "待响应"

        found = get_task(t["id"])
        assert found is not None

    def test_add_task_invalid_type(self):
        from cli_anything.vppapp.core.tasks import add_task
        with pytest.raises(ValueError, match="Invalid type"):
            add_task("X", "InvalidType", 10, "2026-01-01 09:00", "2026-01-01 12:00")

    def test_update_task(self):
        from cli_anything.vppapp.core.tasks import update_task, get_task
        result = update_task("T002", status="执行中", progress=25, currentPower=15.0)
        assert result is not None
        assert result["status"] == "执行中"
        assert result["progress"] == 25

    def test_cancel_task(self):
        from cli_anything.vppapp.core.tasks import cancel_task, get_task
        result = cancel_task("T002")
        assert result is not None
        assert result["status"] == "已取消"

    def test_remove_task(self):
        from cli_anything.vppapp.core.tasks import remove_task, get_task
        removed = remove_task("T001")
        assert removed is True
        assert get_task("T001") is None

    def test_task_summary(self):
        from cli_anything.vppapp.core.tasks import task_summary
        s = task_summary()
        assert "total" in s
        assert s["total"] == 5
        assert "total_reward" in s
        assert s["total_reward"] > 0


# ──────────────────────────────────────────────────────────────────────
# Market tests
# ──────────────────────────────────────────────────────────────────────

class TestMarket:
    def test_list_prices_seeded(self):
        from cli_anything.vppapp.core.market import list_prices
        prices = list_prices()
        assert len(prices) == 24
        assert all("hour" in p and "price" in p and "period" in p for p in prices)

    def test_list_prices_filter_period(self):
        from cli_anything.vppapp.core.market import list_prices
        prices = list_prices(period_filter="谷")
        assert all(p["period"] == "谷" for p in prices)

    def test_get_price(self):
        from cli_anything.vppapp.core.market import get_price
        p = get_price(14)
        assert p is not None
        assert p["hour"] == "14:00"
        assert p["period"] == "尖峰"

    def test_update_price(self):
        from cli_anything.vppapp.core.market import update_price, get_price
        result = update_price(14, price=1.50, forecast=1.48)
        assert result is not None
        assert result["price"] == 1.50

        fetched = get_price(14)
        assert fetched["price"] == 1.50

    def test_market_summary(self):
        from cli_anything.vppapp.core.market import market_summary
        s = market_summary()
        assert "max_price" in s
        assert "min_price" in s
        assert "avg_price" in s
        assert "peak_valley_spread" in s
        assert s["max_price"] > s["min_price"]
        assert "by_period" in s

    def test_strategy_windows(self):
        from cli_anything.vppapp.core.market import get_strategy_windows
        windows = get_strategy_windows()
        assert len(windows) == 3
        types = [w["type"] for w in windows]
        assert "charge" in types
        assert "discharge" in types

    def test_regenerate_prices(self):
        from cli_anything.vppapp.core.market import regenerate_prices, get_price
        # Get original price for hour 14
        original = get_price(14)
        # Regenerate
        new_prices = regenerate_prices()
        assert len(new_prices) == 24
        # Prices should be regenerated (loaded fresh)
        assert new_prices is not None


# ──────────────────────────────────────────────────────────────────────
# Revenue tests
# ──────────────────────────────────────────────────────────────────────

class TestRevenue:
    def test_list_records_seeded(self):
        from cli_anything.vppapp.core.revenue import list_records
        records = list_records()
        assert len(records) == 12
        assert all("key" in r and "type" in r and "amount" in r for r in records)

    def test_list_records_filter_type(self):
        from cli_anything.vppapp.core.revenue import list_records
        records = list_records(type_filter="调峰补贴")
        assert all(r["type"] == "调峰补贴" for r in records)

    def test_list_records_filter_status(self):
        from cli_anything.vppapp.core.revenue import list_records
        records = list_records(status_filter="已结算")
        assert all(r["status"] == "已结算" for r in records)

    def test_get_monthly(self):
        from cli_anything.vppapp.core.revenue import get_monthly
        monthly = get_monthly()
        assert len(monthly) == 12
        assert all("month" in m and "总收益" in m for m in monthly)

    def test_add_record(self):
        from cli_anything.vppapp.core.revenue import add_record, list_records
        r = add_record("2026-03-17", "调峰补贴", 50, 3, 800, status="待结算")
        assert r["amount"] == int(50 * 3 * 800)
        assert r["status"] == "待结算"

        records = list_records()
        assert any(rec["key"] == r["key"] for rec in records)

    def test_add_record_invalid_type(self):
        from cli_anything.vppapp.core.revenue import add_record
        with pytest.raises(ValueError):
            add_record("2026-03-17", "InvalidType", 10, 2, 500)

    def test_update_record_status(self):
        from cli_anything.vppapp.core.revenue import update_record_status, list_records
        # Find a 结算中 record
        records = list_records(status_filter="结算中")
        assert len(records) > 0
        key = records[0]["key"]
        result = update_record_status(key, "已结算")
        assert result is not None
        assert result["status"] == "已结算"

    def test_revenue_summary(self):
        from cli_anything.vppapp.core.revenue import revenue_summary
        s = revenue_summary()
        assert "total_monthly_revenue" in s
        assert "settled" in s
        assert "pending" in s
        assert s["record_count"] == 12


# ──────────────────────────────────────────────────────────────────────
# Theme tests
# ──────────────────────────────────────────────────────────────────────

class TestTheme:
    def test_get_theme_defaults(self):
        from cli_anything.vppapp.core.theme import get_theme
        cfg = get_theme()
        assert cfg["mode"] in ("dark", "light")
        assert cfg["tone"] in ("blue", "green")
        assert "colors" in cfg

    def test_set_theme_mode(self):
        from cli_anything.vppapp.core.theme import set_theme, get_theme
        cfg = set_theme(mode="light")
        assert cfg["mode"] == "light"
        # Verify persisted
        reloaded = get_theme()
        assert reloaded["mode"] == "light"

    def test_set_theme_tone(self):
        from cli_anything.vppapp.core.theme import set_theme, get_theme
        set_theme(tone="green")
        cfg = get_theme()
        assert cfg["tone"] == "green"

    def test_set_theme_both(self):
        from cli_anything.vppapp.core.theme import set_theme, get_theme
        cfg = set_theme(mode="light", tone="green")
        assert cfg["mode"] == "light"
        assert cfg["tone"] == "green"

    def test_set_theme_invalid_mode(self):
        from cli_anything.vppapp.core.theme import set_theme
        with pytest.raises(ValueError, match="Invalid mode"):
            set_theme(mode="rainbow")

    def test_set_theme_invalid_tone(self):
        from cli_anything.vppapp.core.theme import set_theme
        with pytest.raises(ValueError, match="Invalid tone"):
            set_theme(tone="purple")

    def test_list_themes(self):
        from cli_anything.vppapp.core.theme import list_themes
        themes = list_themes()
        assert len(themes) == 4
        combos = [(t["mode"], t["tone"]) for t in themes]
        assert ("dark", "blue") in combos
        assert ("dark", "green") in combos
        assert ("light", "blue") in combos
        assert ("light", "green") in combos

    def test_localstorage_instructions(self):
        from cli_anything.vppapp.core.theme import get_localstorage_instructions
        instructions = get_localstorage_instructions("dark", "green")
        assert "vpp_theme" in instructions
        assert "dark" in instructions
        assert "vpp_tone" in instructions
        assert "green" in instructions


# ──────────────────────────────────────────────────────────────────────
# Project tests
# ──────────────────────────────────────────────────────────────────────

class TestProject:
    def test_list_pages(self):
        from cli_anything.vppapp.core.project import list_pages
        pages = list_pages()
        assert len(pages) >= 9
        names = [p["name"] for p in pages]
        assert "Dashboard" in names
        assert "Devices" in names
        assert "Revenue" in names

    def test_list_pages_role_filter(self):
        from cli_anything.vppapp.core.project import list_pages
        pages = list_pages(role_filter="ops_manager")
        # ops_manager has access to: /, /devices, /demand-response, /compliance-control, /knowledge, /investment
        assert all("ops_manager" in p["allowed_roles"] for p in pages)
        names = [p["name"] for p in pages]
        assert "Dashboard" in names
        assert "Devices" in names
        # SpotMarket is NOT allowed for ops_manager
        assert "SpotMarket" not in names

    def test_get_page(self):
        from cli_anything.vppapp.core.project import get_page
        p = get_page("Dashboard")
        assert p is not None
        assert p["route"] == "/"
        assert "sales_gm" in p["allowed_roles"]

    def test_get_page_not_found(self):
        from cli_anything.vppapp.core.project import get_page
        assert get_page("NonExistentPage") is None

    def test_list_users(self):
        from cli_anything.vppapp.core.project import list_users
        users = list_users()
        assert len(users) == 5
        usernames = [u["username"] for u in users]
        assert "admin" in usernames
        assert "ops" in usernames
        # Passwords should not be exposed
        for u in users:
            assert "password" not in u

    def test_scaffold_page(self):
        from cli_anything.vppapp.core.project import scaffold_page
        info = scaffold_page("TestPage", "/test-page", "A test page")
        assert info["name"] == "TestPage"
        assert info["route"] == "/test-page"
        assert "index.tsx" in info["file_path"]
        assert "useTheme" in info["template"]
        assert len(info["next_steps"]) > 0


# ──────────────────────────────────────────────────────────────────────
# Export tests
# ──────────────────────────────────────────────────────────────────────

class TestExport:
    def test_export_devices_json(self, tmp_path):
        from cli_anything.vppapp.core.export import export_devices
        fp = export_devices(str(tmp_path), "json")
        assert Path(fp).exists()
        with open(fp, encoding="utf-8") as f:
            data = json.load(f)
        assert "devices" in data
        assert data["count"] > 0

    def test_export_devices_csv(self, tmp_path):
        from cli_anything.vppapp.core.export import export_devices
        fp = export_devices(str(tmp_path), "csv")
        assert Path(fp).exists()
        assert fp.endswith(".csv")

    def test_export_tasks_json(self, tmp_path):
        from cli_anything.vppapp.core.export import export_tasks
        fp = export_tasks(str(tmp_path), "json")
        assert Path(fp).exists()
        with open(fp, encoding="utf-8") as f:
            data = json.load(f)
        assert "tasks" in data

    def test_export_market_json(self, tmp_path):
        from cli_anything.vppapp.core.export import export_market
        fp = export_market(str(tmp_path), "json")
        assert Path(fp).exists()
        with open(fp, encoding="utf-8") as f:
            data = json.load(f)
        assert "prices" in data
        assert "summary" in data

    def test_export_revenue_json(self, tmp_path):
        from cli_anything.vppapp.core.export import export_revenue
        fp = export_revenue(str(tmp_path), "json")
        assert Path(fp).exists()
        with open(fp, encoding="utf-8") as f:
            data = json.load(f)
        assert "records" in data
        assert "monthly" in data

    def test_export_all(self, tmp_path):
        from cli_anything.vppapp.core.export import export_all
        files = export_all(str(tmp_path), "json")
        assert len(files) == 4
        for fp in files:
            assert Path(fp).exists()
