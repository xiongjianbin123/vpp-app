"""End-to-end tests for VPP App CLI harness.

Tests the Click CLI commands using CliRunner, verifying:
- JSON output format
- Human-readable output
- Error handling
- CRUD round-trips via CLI
"""

import json
import pytest
from click.testing import CliRunner
from cli_anything.vppapp.vppapp_cli import main


@pytest.fixture(autouse=True)
def temp_data_dir(tmp_path, monkeypatch):
    """Redirect data store to temp directory."""
    data_dir = tmp_path / ".cli-anything-vppapp" / "data"
    data_dir.mkdir(parents=True)
    theme_dir = tmp_path / ".cli-anything-vppapp"

    import cli_anything.vppapp.core.session as session_mod
    import cli_anything.vppapp.core.theme as theme_mod

    monkeypatch.setattr(session_mod, "get_data_dir", lambda: data_dir)
    monkeypatch.setattr(theme_mod, "_CONFIG_DIR", theme_dir)
    monkeypatch.setattr(theme_mod, "_THEME_FILE", theme_dir / "theme.json")
    return tmp_path


@pytest.fixture
def runner():
    return CliRunner()


# ──────────────────────────────────────────────────────────────────────
# Helper
# ──────────────────────────────────────────────────────────────────────

def invoke_json(runner, *args):
    """Run CLI command with --json flag, return parsed response."""
    result = runner.invoke(main, list(args) + ["--json"])
    assert result.exit_code == 0, f"Exit code {result.exit_code}: {result.output}"
    return json.loads(result.output)


# ──────────────────────────────────────────────────────────────────────
# Status command
# ──────────────────────────────────────────────────────────────────────

class TestStatusCommand:
    def test_status_json(self, runner):
        r = invoke_json(runner, "status")
        assert r["success"] is True
        data = r["data"]
        assert "project" in data
        assert "devices" in data
        assert "tasks" in data
        assert "theme" in data

    def test_status_human(self, runner):
        result = runner.invoke(main, ["status"])
        assert result.exit_code == 0
        assert "VPP App Status" in result.output


# ──────────────────────────────────────────────────────────────────────
# Device CLI tests
# ──────────────────────────────────────────────────────────────────────

class TestDeviceCLI:
    def test_device_list_json(self, runner):
        r = invoke_json(runner, "device", "list")
        assert r["success"] is True
        assert "devices" in r["data"]
        assert r["data"]["count"] > 0

    def test_device_list_human(self, runner):
        result = runner.invoke(main, ["device", "list"])
        assert result.exit_code == 0
        assert "Devices" in result.output

    def test_device_list_filter_type(self, runner):
        r = invoke_json(runner, "device", "list", "--type", "电网储能")
        devices = r["data"]["devices"]
        assert all(d["type"] == "电网储能" for d in devices)

    def test_device_list_filter_status(self, runner):
        r = invoke_json(runner, "device", "list", "--status", "在线")
        devices = r["data"]["devices"]
        assert all(d["status"] == "在线" for d in devices)

    def test_device_get_json(self, runner):
        r = invoke_json(runner, "device", "get", "E001")
        assert r["success"] is True
        assert r["data"]["id"] == "E001"

    def test_device_get_not_found(self, runner):
        r = invoke_json(runner, "device", "get", "NOPE")
        assert r["success"] is False

    def test_device_add_json(self, runner):
        r = invoke_json(
            runner, "device", "add",
            "--name", "Test Battery CLI",
            "--type", "储能系统",
            "--capacity", "100",
            "--location", "Test City"
        )
        assert r["success"] is True
        assert r["data"]["name"] == "Test Battery CLI"
        assert r["data"]["capacity"] == 100.0

    def test_device_add_invalid_type(self, runner):
        r = invoke_json(
            runner, "device", "add",
            "--name", "X",
            "--type", "BadType",
            "--capacity", "10",
            "--location", "Loc"
        )
        assert r["success"] is False

    def test_device_update_json(self, runner):
        r = invoke_json(runner, "device", "update", "E001", "--soc", "88")
        assert r["success"] is True
        assert r["data"]["soc"] == 88.0

    def test_device_remove_json(self, runner):
        r = invoke_json(runner, "device", "remove", "E001")
        assert r["success"] is True
        assert r["data"]["removed"] is True

        # Verify gone
        r2 = invoke_json(runner, "device", "get", "E001")
        assert r2["success"] is False

    def test_device_status_json(self, runner):
        r = invoke_json(runner, "device", "status")
        assert r["success"] is True
        assert "total" in r["data"]
        assert r["data"]["total"] > 0


# ──────────────────────────────────────────────────────────────────────
# Task CLI tests
# ──────────────────────────────────────────────────────────────────────

class TestTaskCLI:
    def test_task_list_json(self, runner):
        r = invoke_json(runner, "task", "list")
        assert r["success"] is True
        assert r["data"]["count"] == 5

    def test_task_list_filter(self, runner):
        r = invoke_json(runner, "task", "list", "--type", "调峰")
        tasks = r["data"]["tasks"]
        assert all(t["type"] == "调峰" for t in tasks)

    def test_task_get_json(self, runner):
        r = invoke_json(runner, "task", "get", "T001")
        assert r["success"] is True
        assert r["data"]["id"] == "T001"

    def test_task_add_json(self, runner):
        r = invoke_json(
            runner, "task", "add",
            "--name", "New CLI Task",
            "--type", "调频",
            "--target-power", "30",
            "--start", "2026-03-17 14:00",
            "--end", "2026-03-17 16:00",
            "--reward", "80000"
        )
        assert r["success"] is True
        assert r["data"]["name"] == "New CLI Task"
        assert r["data"]["reward"] == 80000

    def test_task_update_status(self, runner):
        r = invoke_json(runner, "task", "update", "T002", "--status", "执行中", "--progress", "40")
        assert r["success"] is True
        assert r["data"]["status"] == "执行中"
        assert r["data"]["progress"] == 40

    def test_task_cancel(self, runner):
        r = invoke_json(runner, "task", "cancel", "T002")
        assert r["success"] is True
        assert r["data"]["status"] == "已取消"

    def test_task_remove(self, runner):
        r = invoke_json(runner, "task", "remove", "T001")
        assert r["success"] is True
        assert r["data"]["removed"] is True

    def test_task_summary_json(self, runner):
        r = invoke_json(runner, "task", "summary")
        assert r["success"] is True
        assert r["data"]["total"] == 5


# ──────────────────────────────────────────────────────────────────────
# Market CLI tests
# ──────────────────────────────────────────────────────────────────────

class TestMarketCLI:
    def test_market_prices_json(self, runner):
        r = invoke_json(runner, "market", "prices")
        assert r["success"] is True
        assert r["data"]["count"] == 24

    def test_market_prices_filter_period(self, runner):
        r = invoke_json(runner, "market", "prices", "--period", "尖峰")
        prices = r["data"]["prices"]
        assert all(p["period"] == "尖峰" for p in prices)

    def test_market_summary_json(self, runner):
        r = invoke_json(runner, "market", "summary")
        assert r["success"] is True
        assert "max_price" in r["data"]
        assert "peak_valley_spread" in r["data"]

    def test_market_strategy_json(self, runner):
        r = invoke_json(runner, "market", "strategy")
        assert r["success"] is True
        windows = r["data"]["strategy_windows"]
        assert len(windows) == 3

    def test_market_regenerate_json(self, runner):
        r = invoke_json(runner, "market", "regenerate")
        assert r["success"] is True
        assert r["data"]["regenerated"] is True

    def test_market_set_price_json(self, runner):
        r = invoke_json(runner, "market", "set-price", "14", "--price", "1.35")
        assert r["success"] is True
        assert r["data"]["price"] == 1.35


# ──────────────────────────────────────────────────────────────────────
# Revenue CLI tests
# ──────────────────────────────────────────────────────────────────────

class TestRevenueCLI:
    def test_revenue_records_json(self, runner):
        r = invoke_json(runner, "revenue", "records")
        assert r["success"] is True
        assert r["data"]["count"] == 12

    def test_revenue_records_filter(self, runner):
        r = invoke_json(runner, "revenue", "records", "--type", "调峰补贴", "--status", "已结算")
        records = r["data"]["records"]
        assert all(rec["type"] == "调峰补贴" for rec in records)
        assert all(rec["status"] == "已结算" for rec in records)

    def test_revenue_monthly_json(self, runner):
        r = invoke_json(runner, "revenue", "monthly")
        assert r["success"] is True
        assert len(r["data"]["monthly"]) == 12

    def test_revenue_add_json(self, runner):
        r = invoke_json(
            runner, "revenue", "add",
            "--date", "2026-03-17",
            "--type", "调峰补贴",
            "--power", "50",
            "--duration", "3",
            "--unit-price", "800"
        )
        assert r["success"] is True
        assert r["data"]["amount"] == int(50 * 3 * 800)

    def test_revenue_settle_json(self, runner):
        # Find a 结算中 record
        r = invoke_json(runner, "revenue", "records", "--status", "结算中")
        records = r["data"]["records"]
        assert len(records) > 0
        key = records[0]["key"]

        r2 = invoke_json(runner, "revenue", "settle", key, "--status", "已结算")
        assert r2["success"] is True
        assert r2["data"]["status"] == "已结算"

    def test_revenue_summary_json(self, runner):
        r = invoke_json(runner, "revenue", "summary")
        assert r["success"] is True
        assert "total_monthly_revenue" in r["data"]


# ──────────────────────────────────────────────────────────────────────
# Theme CLI tests
# ──────────────────────────────────────────────────────────────────────

class TestThemeCLI:
    def test_theme_get_json(self, runner):
        r = invoke_json(runner, "theme", "get")
        assert r["success"] is True
        assert "mode" in r["data"]
        assert "tone" in r["data"]

    def test_theme_set_json(self, runner):
        r = invoke_json(runner, "theme", "set", "--mode", "light", "--tone", "green")
        assert r["success"] is True
        assert r["data"]["mode"] == "light"
        assert r["data"]["tone"] == "green"

    def test_theme_set_persists(self, runner):
        runner.invoke(main, ["theme", "set", "--mode", "light", "--tone", "green"])
        r = invoke_json(runner, "theme", "get")
        assert r["data"]["mode"] == "light"
        assert r["data"]["tone"] == "green"

    def test_theme_set_invalid(self, runner):
        r = invoke_json(runner, "theme", "set", "--mode", "neon")
        assert r["success"] is False

    def test_theme_list_json(self, runner):
        r = invoke_json(runner, "theme", "list")
        assert r["success"] is True
        assert len(r["data"]["themes"]) == 4


# ──────────────────────────────────────────────────────────────────────
# Build CLI tests (subprocess not actually run)
# ──────────────────────────────────────────────────────────────────────

class TestBuildCLI:
    def test_build_status_json(self, runner):
        r = invoke_json(runner, "build", "status")
        assert r["success"] is True
        assert "built" in r["data"]

    def test_build_deps_json(self, runner):
        r = invoke_json(runner, "build", "deps")
        assert r["success"] is True
        assert "node_modules_exists" in r["data"]


# ──────────────────────────────────────────────────────────────────────
# Page CLI tests
# ──────────────────────────────────────────────────────────────────────

class TestPageCLI:
    def test_page_list_json(self, runner):
        r = invoke_json(runner, "page", "list")
        assert r["success"] is True
        assert r["data"]["count"] >= 9

    def test_page_list_role_filter(self, runner):
        r = invoke_json(runner, "page", "list", "--role", "ops_manager")
        pages = r["data"]["pages"]
        assert all("ops_manager" in p["allowed_roles"] for p in pages)

    def test_page_info_json(self, runner):
        r = invoke_json(runner, "page", "info", "Dashboard")
        assert r["success"] is True
        assert r["data"]["route"] == "/"

    def test_page_info_not_found(self, runner):
        r = invoke_json(runner, "page", "info", "NonExistent")
        assert r["success"] is False

    def test_page_scaffold_dry_run(self, runner):
        r = invoke_json(
            runner, "page", "scaffold", "MyNewPage",
            "--route", "/my-new-page",
            "--description", "Test page"
        )
        assert r["success"] is True
        assert r["data"]["name"] == "MyNewPage"
        assert "/my-new-page" in r["data"]["route"]


# ──────────────────────────────────────────────────────────────────────
# Export CLI tests
# ──────────────────────────────────────────────────────────────────────

class TestExportCLI:
    def test_export_all_json(self, runner, tmp_path):
        r = invoke_json(
            runner, "export", "all",
            "--format", "json",
            "--output", str(tmp_path / "export")
        )
        assert r["success"] is True
        assert r["data"]["count"] == 4

    def test_export_devices_json(self, runner, tmp_path):
        r = invoke_json(
            runner, "export", "devices",
            "--format", "json",
            "--output", str(tmp_path / "export")
        )
        assert r["success"] is True
        assert "file" in r["data"]

    def test_export_all_csv(self, runner, tmp_path):
        r = invoke_json(
            runner, "export", "all",
            "--format", "csv",
            "--output", str(tmp_path / "export")
        )
        assert r["success"] is True
        assert r["data"]["format"] == "csv"
