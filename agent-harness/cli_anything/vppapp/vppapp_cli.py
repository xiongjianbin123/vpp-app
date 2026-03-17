"""cli-anything-vppapp — CLI harness for the VPP App.

Virtual Power Plant management platform (React 19 + Vite + Ant Design).

Entry point: cli-anything-vppapp
Default behavior: REPL mode (invoke_without_command=True)

Usage:
  cli-anything-vppapp                    # REPL mode
  cli-anything-vppapp device list        # Direct command
  cli-anything-vppapp device list --json # JSON output for agents
"""

import json
import sys
import shlex
import click
from cli_anything.vppapp import __version__
from cli_anything.vppapp.utils.repl_skin import ReplSkin

# Initialize skin
skin = ReplSkin("vppapp", version=__version__)


def _json_out(data, success: bool = True):
    """Print JSON output and exit."""
    if not success:
        click.echo(json.dumps({"success": False, "error": data}, ensure_ascii=False, indent=2))
    else:
        click.echo(json.dumps({"success": True, "data": data}, ensure_ascii=False, indent=2))


def _or_json(data, json_flag: bool, render_fn=None):
    """Either render data as human-readable or JSON."""
    if json_flag:
        _json_out(data)
    elif render_fn:
        render_fn(data)


# ──────────────────────────────────────────────────────────────────────
# Main CLI group
# ──────────────────────────────────────────────────────────────────────

@click.group(invoke_without_command=True)
@click.version_option(version=__version__, prog_name="cli-anything-vppapp")
@click.pass_context
def main(ctx):
    """cli-anything-vppapp — Virtual Power Plant App CLI harness.

    Run without subcommand to enter REPL mode.
    Add --json to any command for machine-readable output.
    """
    if ctx.invoked_subcommand is None:
        _run_repl()


# ──────────────────────────────────────────────────────────────────────
# device commands
# ──────────────────────────────────────────────────────────────────────

@main.group()
def device():
    """Device asset management (储能/光伏/风电/充电桩/工业负荷)."""
    pass


@device.command("list")
@click.option("--type", "device_type", default=None,
              help="Filter by type: 光伏电站|储能系统|风电|充电桩|工业负荷|电网储能")
@click.option("--status", default=None, help="Filter by status: 在线|离线|维护|告警")
@click.option("--json", "use_json", is_flag=True, help="Output JSON")
def device_list(device_type, status, use_json):
    """List all devices."""
    from cli_anything.vppapp.core.devices import list_devices
    try:
        devices = list_devices(device_type, status)
        if use_json:
            _json_out({"devices": devices, "count": len(devices)})
            return
        skin.section(f"Devices ({len(devices)} total)")
        headers = ["ID", "Name", "Type", "Status", "Cap(MW)", "Power(MW)", "SOC%", "Location"]
        rows = [
            [
                d.get("id", ""),
                d.get("name", "")[:20],
                d.get("type", ""),
                d.get("status", ""),
                str(d.get("capacity", "")),
                str(d.get("currentPower", "")),
                str(d.get("soc", "-")),
                d.get("location", "")[:20],
            ]
            for d in devices
        ]
        skin.table(headers, rows)
    except Exception as e:
        if use_json:
            _json_out(str(e), success=False)
        else:
            skin.error(str(e))


@device.command("get")
@click.argument("device_id")
@click.option("--json", "use_json", is_flag=True, help="Output JSON")
def device_get(device_id, use_json):
    """Get details of a specific device by ID."""
    from cli_anything.vppapp.core.devices import get_device
    d = get_device(device_id)
    if d is None:
        if use_json:
            _json_out(f"Device '{device_id}' not found", success=False)
        else:
            skin.error(f"Device '{device_id}' not found")
        return
    if use_json:
        _json_out(d)
        return
    skin.section(f"Device: {d['name']} ({d['id']})")
    for k, v in d.items():
        skin.status(k, str(v))


@device.command("add")
@click.option("--name", required=True, help="Device name")
@click.option("--type", "device_type", required=True,
              help="Device type: 光伏电站|储能系统|风电|充电桩|工业负荷|电网储能")
@click.option("--capacity", required=True, type=float, help="Rated capacity in MW")
@click.option("--location", required=True, help="Physical location")
@click.option("--status", default="在线", help="Status: 在线|离线|维护|告警")
@click.option("--energy-capacity", type=float, default=None, help="Energy capacity in MWh (for storage)")
@click.option("--soc", type=float, default=None, help="State of Charge %")
@click.option("--json", "use_json", is_flag=True, help="Output JSON")
def device_add(name, device_type, capacity, location, status, energy_capacity, soc, use_json):
    """Add a new device."""
    from cli_anything.vppapp.core.devices import add_device
    kwargs = {}
    if energy_capacity is not None:
        kwargs["energyCapacity"] = energy_capacity
    if soc is not None:
        kwargs["soc"] = soc
    try:
        device = add_device(name, device_type, capacity, location, status, **kwargs)
        if use_json:
            _json_out(device)
        else:
            skin.success(f"Device '{name}' added with ID {device['id']}")
            skin.status("ID", device["id"])
            skin.status("Type", device_type)
            skin.status("Capacity", f"{capacity} MW")
    except ValueError as e:
        if use_json:
            _json_out(str(e), success=False)
        else:
            skin.error(str(e))


@device.command("update")
@click.argument("device_id")
@click.option("--name", default=None)
@click.option("--status", default=None, help="在线|离线|维护|告警")
@click.option("--current-power", type=float, default=None, help="Current power in MW")
@click.option("--soc", type=float, default=None, help="State of Charge %")
@click.option("--json", "use_json", is_flag=True)
def device_update(device_id, name, status, current_power, soc, use_json):
    """Update a device's fields."""
    from cli_anything.vppapp.core.devices import update_device
    kwargs = {}
    if name:
        kwargs["name"] = name
    if status:
        kwargs["status"] = status
    if current_power is not None:
        kwargs["currentPower"] = current_power
    if soc is not None:
        kwargs["soc"] = soc
    result = update_device(device_id, **kwargs)
    if result is None:
        if use_json:
            _json_out(f"Device '{device_id}' not found", success=False)
        else:
            skin.error(f"Device '{device_id}' not found")
        return
    if use_json:
        _json_out(result)
    else:
        skin.success(f"Device {device_id} updated")


@device.command("remove")
@click.argument("device_id")
@click.option("--json", "use_json", is_flag=True)
def device_remove(device_id, use_json):
    """Remove a device by ID."""
    from cli_anything.vppapp.core.devices import remove_device
    removed = remove_device(device_id)
    if use_json:
        _json_out({"removed": removed, "id": device_id})
    elif removed:
        skin.success(f"Device {device_id} removed")
    else:
        skin.error(f"Device '{device_id}' not found")


@device.command("status")
@click.option("--json", "use_json", is_flag=True)
def device_status(use_json):
    """Show fleet status summary."""
    from cli_anything.vppapp.core.devices import device_status_summary
    summary = device_status_summary()
    if use_json:
        _json_out(summary)
        return
    skin.section("Device Fleet Status")
    for k, v in summary.items():
        skin.status(k, str(v))


# ──────────────────────────────────────────────────────────────────────
# task commands
# ──────────────────────────────────────────────────────────────────────

@main.group()
def task():
    """Demand response task management (调峰/调频/备用)."""
    pass


@task.command("list")
@click.option("--type", "task_type", default=None, help="调峰|调频|备用")
@click.option("--status", default=None, help="待响应|执行中|已完成|已取消")
@click.option("--json", "use_json", is_flag=True)
def task_list(task_type, status, use_json):
    """List demand response tasks."""
    from cli_anything.vppapp.core.tasks import list_tasks
    tasks = list_tasks(task_type, status)
    if use_json:
        _json_out({"tasks": tasks, "count": len(tasks)})
        return
    skin.section(f"Tasks ({len(tasks)} total)")
    headers = ["ID", "Name", "Type", "Status", "Target(MW)", "Progress%", "Reward(元)"]
    rows = [
        [
            t.get("id", ""),
            t.get("name", "")[:22],
            t.get("type", ""),
            t.get("status", ""),
            str(t.get("targetPower", "")),
            str(t.get("progress", "")),
            str(t.get("reward", "")),
        ]
        for t in tasks
    ]
    skin.table(headers, rows)


@task.command("get")
@click.argument("task_id")
@click.option("--json", "use_json", is_flag=True)
def task_get(task_id, use_json):
    """Get details of a specific task."""
    from cli_anything.vppapp.core.tasks import get_task
    t = get_task(task_id)
    if t is None:
        if use_json:
            _json_out(f"Task '{task_id}' not found", success=False)
        else:
            skin.error(f"Task '{task_id}' not found")
        return
    if use_json:
        _json_out(t)
    else:
        skin.section(f"Task: {t['name']}")
        for k, v in t.items():
            skin.status(k, str(v))


@task.command("add")
@click.option("--name", required=True)
@click.option("--type", "task_type", required=True, help="调峰|调频|备用")
@click.option("--target-power", required=True, type=float, help="Target power in MW")
@click.option("--start", required=True, help="Start time e.g. 2026-03-17 09:00")
@click.option("--end", required=True, help="End time e.g. 2026-03-17 12:00")
@click.option("--reward", type=float, default=0)
@click.option("--json", "use_json", is_flag=True)
def task_add(name, task_type, target_power, start, end, reward, use_json):
    """Add a new demand response task."""
    from cli_anything.vppapp.core.tasks import add_task
    try:
        t = add_task(name, task_type, target_power, start, end, reward)
        if use_json:
            _json_out(t)
        else:
            skin.success(f"Task '{name}' created with ID {t['id']}")
    except ValueError as e:
        if use_json:
            _json_out(str(e), success=False)
        else:
            skin.error(str(e))


@task.command("update")
@click.argument("task_id")
@click.option("--status", default=None, help="待响应|执行中|已完成|已取消")
@click.option("--progress", type=int, default=None, help="Progress 0-100")
@click.option("--current-power", type=float, default=None)
@click.option("--json", "use_json", is_flag=True)
def task_update(task_id, status, progress, current_power, use_json):
    """Update a task's status or progress."""
    from cli_anything.vppapp.core.tasks import update_task
    kwargs = {}
    if status:
        kwargs["status"] = status
    if progress is not None:
        kwargs["progress"] = progress
    if current_power is not None:
        kwargs["currentPower"] = current_power
    result = update_task(task_id, **kwargs)
    if result is None:
        if use_json:
            _json_out(f"Task '{task_id}' not found", success=False)
        else:
            skin.error(f"Task '{task_id}' not found")
        return
    if use_json:
        _json_out(result)
    else:
        skin.success(f"Task {task_id} updated")


@task.command("cancel")
@click.argument("task_id")
@click.option("--json", "use_json", is_flag=True)
def task_cancel(task_id, use_json):
    """Cancel a task."""
    from cli_anything.vppapp.core.tasks import cancel_task
    result = cancel_task(task_id)
    if use_json:
        _json_out(result if result else {"error": f"Task '{task_id}' not found"}, success=result is not None)
    elif result:
        skin.success(f"Task {task_id} cancelled")
    else:
        skin.error(f"Task '{task_id}' not found")


@task.command("remove")
@click.argument("task_id")
@click.option("--json", "use_json", is_flag=True)
def task_remove(task_id, use_json):
    """Remove a task by ID."""
    from cli_anything.vppapp.core.tasks import remove_task
    removed = remove_task(task_id)
    if use_json:
        _json_out({"removed": removed, "id": task_id})
    elif removed:
        skin.success(f"Task {task_id} removed")
    else:
        skin.error(f"Task '{task_id}' not found")


@task.command("summary")
@click.option("--json", "use_json", is_flag=True)
def task_summary_cmd(use_json):
    """Show task summary statistics."""
    from cli_anything.vppapp.core.tasks import task_summary
    summary = task_summary()
    if use_json:
        _json_out(summary)
    else:
        skin.section("Task Summary")
        for k, v in summary.items():
            skin.status(k, str(v))


# ──────────────────────────────────────────────────────────────────────
# market commands
# ──────────────────────────────────────────────────────────────────────

@main.group()
def market():
    """Spot market price data management (现货市场)."""
    pass


@market.command("prices")
@click.option("--period", default=None, help="Filter: 谷|平|峰|尖峰")
@click.option("--json", "use_json", is_flag=True)
def market_prices(period, use_json):
    """Show 24-hour spot market prices."""
    from cli_anything.vppapp.core.market import list_prices
    prices = list_prices(period)
    if use_json:
        _json_out({"prices": prices, "count": len(prices)})
        return
    skin.section("Spot Market Prices")
    headers = ["Hour", "Period", "Price(¥/kWh)", "Forecast", "Load(MW)"]
    rows = [
        [p["hour"], p["period"], str(p["price"]), str(p["forecast"]), str(p["load"])]
        for p in prices
    ]
    skin.table(headers, rows)


@market.command("summary")
@click.option("--json", "use_json", is_flag=True)
def market_summary_cmd(use_json):
    """Show spot market summary statistics."""
    from cli_anything.vppapp.core.market import market_summary
    summary = market_summary()
    if use_json:
        _json_out(summary)
    else:
        skin.section("Market Summary")
        for k, v in summary.items():
            if isinstance(v, dict):
                skin.info(f"{k}:")
                for kk, vv in v.items():
                    skin.status(f"  {kk}", str(vv))
            else:
                skin.status(k, str(v))


@market.command("strategy")
@click.option("--json", "use_json", is_flag=True)
def market_strategy(use_json):
    """Show charge/discharge strategy windows."""
    from cli_anything.vppapp.core.market import get_strategy_windows
    windows = get_strategy_windows()
    if use_json:
        _json_out({"strategy_windows": windows})
        return
    skin.section("Arbitrage Strategy Windows")
    for w in windows:
        icon = "↓" if w["type"] == "charge" else "↑"
        skin.info(f"{icon} {w['label']}  {w['start']:02d}:00-{w['end']:02d}:00  avg={w['avg_price']}¥/kWh")
        skin.hint(f"   {w['advice']}")


@market.command("regenerate")
@click.option("--json", "use_json", is_flag=True)
def market_regenerate(use_json):
    """Regenerate 24h market prices with fresh random values."""
    from cli_anything.vppapp.core.market import regenerate_prices
    prices = regenerate_prices()
    if use_json:
        _json_out({"regenerated": True, "count": len(prices)})
    else:
        skin.success(f"Market prices regenerated ({len(prices)} data points)")


@market.command("set-price")
@click.argument("hour", type=int)
@click.option("--price", type=float, default=None, help="Actual price ¥/kWh")
@click.option("--forecast", type=float, default=None, help="Forecast price ¥/kWh")
@click.option("--json", "use_json", is_flag=True)
def market_set_price(hour, price, forecast, use_json):
    """Override price for a specific hour (0-23)."""
    from cli_anything.vppapp.core.market import update_price
    result = update_price(hour, price, forecast)
    if result is None:
        if use_json:
            _json_out(f"Hour {hour} not found", success=False)
        else:
            skin.error(f"Hour {hour} not found")
        return
    if use_json:
        _json_out(result)
    else:
        skin.success(f"Price for {result['hour']} updated to {result['price']} ¥/kWh")


# ──────────────────────────────────────────────────────────────────────
# revenue commands
# ──────────────────────────────────────────────────────────────────────

@main.group()
def revenue():
    """Revenue and settlement records management (收益结算)."""
    pass


@revenue.command("records")
@click.option("--type", "rev_type", default=None, help="调峰补贴|调频补贴|辅助服务|备用容量")
@click.option("--status", default=None, help="已结算|结算中|待结算")
@click.option("--from", "date_from", default=None, help="Start date YYYY-MM-DD")
@click.option("--to", "date_to", default=None, help="End date YYYY-MM-DD")
@click.option("--json", "use_json", is_flag=True)
def revenue_records(rev_type, status, date_from, date_to, use_json):
    """List revenue/subsidy records."""
    from cli_anything.vppapp.core.revenue import list_records
    records = list_records(rev_type, status, date_from, date_to)
    if use_json:
        _json_out({"records": records, "count": len(records)})
        return
    skin.section(f"Revenue Records ({len(records)} total)")
    headers = ["Key", "Date", "Type", "Power(MW)", "Duration(h)", "UnitPrice", "Amount(元)", "Status"]
    rows = [
        [r.get("key",""), r.get("date",""), r.get("type",""),
         str(r.get("power","")), str(r.get("duration","")),
         str(r.get("unitPrice","")), str(r.get("amount","")),
         r.get("status","")]
        for r in records
    ]
    skin.table(headers, rows)


@revenue.command("monthly")
@click.option("--json", "use_json", is_flag=True)
def revenue_monthly(use_json):
    """Show monthly revenue breakdown."""
    from cli_anything.vppapp.core.revenue import get_monthly
    monthly = get_monthly()
    if use_json:
        _json_out({"monthly": monthly})
        return
    skin.section("Monthly Revenue")
    headers = ["Month", "调峰收益", "调频收益", "辅助服务", "总收益"]
    rows = [
        [m.get("month",""), str(m.get("调峰收益","")),
         str(m.get("调频收益","")), str(m.get("辅助服务","")),
         str(m.get("总收益",""))]
        for m in monthly
    ]
    skin.table(headers, rows)


@revenue.command("add")
@click.option("--date", required=True, help="Date YYYY-MM-DD")
@click.option("--type", "rev_type", required=True, help="调峰补贴|调频补贴|辅助服务|备用容量")
@click.option("--power", required=True, type=float, help="Response power MW")
@click.option("--duration", required=True, type=float, help="Duration hours")
@click.option("--unit-price", required=True, type=float, help="Unit price 元/MWh")
@click.option("--status", default="待结算", help="已结算|结算中|待结算")
@click.option("--json", "use_json", is_flag=True)
def revenue_add(date, rev_type, power, duration, unit_price, status, use_json):
    """Add a new revenue record."""
    from cli_anything.vppapp.core.revenue import add_record
    try:
        record = add_record(date, rev_type, power, duration, unit_price, status)
        if use_json:
            _json_out(record)
        else:
            skin.success(f"Record added: amount={record['amount']}元")
    except ValueError as e:
        if use_json:
            _json_out(str(e), success=False)
        else:
            skin.error(str(e))


@revenue.command("settle")
@click.argument("key")
@click.option("--status", default="已结算", help="New settlement status")
@click.option("--json", "use_json", is_flag=True)
def revenue_settle(key, status, use_json):
    """Update settlement status of a record."""
    from cli_anything.vppapp.core.revenue import update_record_status
    try:
        result = update_record_status(key, status)
        if use_json:
            _json_out(result if result else {"error": f"Record '{key}' not found"}, success=result is not None)
        elif result:
            skin.success(f"Record {key} status updated to '{status}'")
        else:
            skin.error(f"Record '{key}' not found")
    except ValueError as e:
        if use_json:
            _json_out(str(e), success=False)
        else:
            skin.error(str(e))


@revenue.command("summary")
@click.option("--json", "use_json", is_flag=True)
def revenue_summary_cmd(use_json):
    """Show revenue summary statistics."""
    from cli_anything.vppapp.core.revenue import revenue_summary
    summary = revenue_summary()
    if use_json:
        _json_out(summary)
    else:
        skin.section("Revenue Summary")
        for k, v in summary.items():
            skin.status(k, str(v))


# ──────────────────────────────────────────────────────────────────────
# theme commands
# ──────────────────────────────────────────────────────────────────────

@main.group()
def theme():
    """Theme config: mode (dark/light) and tone (blue/green)."""
    pass


@theme.command("get")
@click.option("--json", "use_json", is_flag=True)
def theme_get(use_json):
    """Show current theme configuration."""
    from cli_anything.vppapp.core.theme import get_theme
    cfg = get_theme()
    if use_json:
        _json_out(cfg)
        return
    skin.section("Theme Configuration")
    skin.status("Mode", cfg["mode"])
    skin.status("Tone", cfg["tone"])
    skin.status("Config file", cfg["config_file"])
    skin.info("Colors:")
    for k, v in cfg.get("colors", {}).items():
        skin.hint(f"    {k}: {v}")
    skin.info("Browser localStorage commands:")
    from cli_anything.vppapp.core.theme import get_localstorage_instructions
    instructions = get_localstorage_instructions(cfg["mode"], cfg["tone"])
    for line in instructions.split("\n"):
        skin.hint(f"    {line}")


@theme.command("set")
@click.option("--mode", default=None, help="dark|light")
@click.option("--tone", default=None, help="blue|green")
@click.option("--json", "use_json", is_flag=True)
def theme_set(mode, tone, use_json):
    """Set theme mode and/or tone."""
    from cli_anything.vppapp.core.theme import set_theme
    try:
        cfg = set_theme(mode, tone)
        if use_json:
            _json_out(cfg)
        else:
            skin.success(f"Theme set: mode={cfg['mode']}, tone={cfg['tone']}")
            skin.hint("  Apply in browser:")
            from cli_anything.vppapp.core.theme import get_localstorage_instructions
            for line in get_localstorage_instructions(cfg["mode"], cfg["tone"]).split("\n"):
                skin.hint(f"    {line}")
    except ValueError as e:
        if use_json:
            _json_out(str(e), success=False)
        else:
            skin.error(str(e))


@theme.command("list")
@click.option("--json", "use_json", is_flag=True)
def theme_list(use_json):
    """List all available theme combinations."""
    from cli_anything.vppapp.core.theme import list_themes
    themes = list_themes()
    if use_json:
        _json_out({"themes": themes})
        return
    skin.section("Available Themes")
    headers = ["Mode", "Tone", "Primary Color", "BG Page", "Description"]
    rows = [
        [t["mode"], t["tone"], t["primary_color"], t["bg_page"], t["description"]]
        for t in themes
    ]
    skin.table(headers, rows)


# ──────────────────────────────────────────────────────────────────────
# build commands
# ──────────────────────────────────────────────────────────────────────

@main.group()
def build():
    """npm build/dev/preview commands via subprocess."""
    pass


@build.command("run")
@click.option("--json", "use_json", is_flag=True)
def build_run(use_json):
    """Run npm run build (TypeScript check + Vite build)."""
    from cli_anything.vppapp.utils.vppapp_backend import run_build
    if not use_json:
        skin.info("Running npm run build...")
    result = run_build()
    if use_json:
        _json_out(result)
        return
    if result["success"]:
        skin.success("Build succeeded!")
    else:
        skin.error("Build failed!")
        if result.get("stderr"):
            skin.hint(result["stderr"][:500])


@build.command("lint")
@click.option("--json", "use_json", is_flag=True)
def build_lint(use_json):
    """Run npm run lint (ESLint)."""
    from cli_anything.vppapp.utils.vppapp_backend import run_lint
    if not use_json:
        skin.info("Running npm run lint...")
    result = run_lint()
    if use_json:
        _json_out(result)
        return
    if result["success"]:
        skin.success("Lint passed!")
    else:
        skin.error("Lint failed!")
        if result.get("stdout"):
            skin.hint(result["stdout"][:800])


@build.command("status")
@click.option("--json", "use_json", is_flag=True)
def build_status(use_json):
    """Check build status (dist/ directory)."""
    from cli_anything.vppapp.core.project import check_build_status
    status = check_build_status()
    if use_json:
        _json_out(status)
        return
    skin.section("Build Status")
    for k, v in status.items():
        skin.status(k, str(v))


@build.command("deploy")
@click.option("--message", "-m", default=None, help="Commit message (auto-generated if omitted)")
@click.option("--files", "-f", multiple=True, help="Specific files to stage (default: all changes)")
@click.option("--no-push", is_flag=True, default=False, help="Commit only, skip git push")
@click.option("--json", "use_json", is_flag=True)
def build_deploy(message, files, no_push, use_json):
    """Build → git add → git commit → git push (triggers GitHub Actions)."""
    from cli_anything.vppapp.utils.vppapp_backend import run_build, git_deploy

    result = {"steps": {}, "success": False}

    # Step 1: npm run build
    if not use_json:
        skin.info("Step 1/2: Running npm run build...")
    build_r = run_build()
    result["steps"]["build"] = {
        "success": build_r["success"],
        "returncode": build_r["returncode"],
    }
    if not build_r["success"]:
        result["error"] = "Build failed — aborting deploy"
        result["steps"]["build"]["stderr"] = build_r.get("stderr", "")[:300]
        if use_json:
            _json_out(result)
        else:
            skin.error("Build failed — deploy aborted")
            skin.hint(build_r.get("stderr", "")[:300])
        return
    if not use_json:
        skin.success("Build succeeded")
        skin.info("Step 2/2: Deploying via git push...")

    # Step 2: git add + commit + push
    deploy_r = git_deploy(
        message=message,
        files=list(files) if files else None,
        push=not no_push,
    )
    result["steps"]["git"] = deploy_r["steps"]
    result["success"] = deploy_r["success"]

    if deploy_r.get("committed_files"):
        result["committed_files"] = deploy_r["committed_files"]
    if deploy_r.get("commit_message"):
        result["commit_message"] = deploy_r["commit_message"]
    if deploy_r.get("error"):
        result["error"] = deploy_r["error"]

    if use_json:
        _json_out(result)
        return

    if deploy_r["success"]:
        skin.success(f"Deployed! Commit: {deploy_r.get('commit_message', '')}")
        for f in deploy_r.get("committed_files", []):
            skin.hint(f"  + {f}")
        if not no_push:
            skin.info("GitHub Actions triggered — check Actions tab for deploy status")
    else:
        skin.error(f"Deploy failed: {deploy_r.get('error', 'unknown error')}")


@build.command("git-status")
@click.option("--json", "use_json", is_flag=True)
def build_git_status(use_json):
    """Show git status (branch, staged/unstaged changes)."""
    from cli_anything.vppapp.utils.vppapp_backend import git_status
    s = git_status()
    if use_json:
        _json_out(s)
        return
    skin.section("Git Status")
    skin.status("branch", s["branch"])
    skin.status("remote", s["remote"])
    skin.status("clean", "yes" if s["clean"] else "no")
    if s["staged"]:
        skin.info(f"Staged ({len(s['staged'])}):")
        for f in s["staged"]:
            skin.hint(f"  M {f}")
    if s["unstaged"]:
        skin.info(f"Unstaged ({len(s['unstaged'])}):")
        for f in s["unstaged"]:
            skin.hint(f"  M {f}")
    if s["untracked"]:
        skin.info(f"Untracked ({len(s['untracked'])}):")
        for f in s["untracked"][:10]:
            skin.hint(f"  ? {f}")


@build.command("deps")
@click.option("--json", "use_json", is_flag=True)
def build_deps(use_json):
    """Check npm dependencies (node_modules)."""
    from cli_anything.vppapp.utils.vppapp_backend import check_dependencies, get_node_version
    deps = check_dependencies()
    versions = get_node_version()
    result = {**deps, "toolchain": versions}
    if use_json:
        _json_out(result)
        return
    skin.section("Dependencies")
    skin.status("node version", versions.get("node", "not found"))
    skin.status("npm version", versions.get("npm", "not found"))
    skin.status("node_modules", "exists" if deps["node_modules_exists"] else "MISSING")
    if deps.get("installed_packages"):
        skin.status("packages installed", str(deps["installed_packages"]))
    if deps.get("message"):
        skin.warning(deps["message"])


# ──────────────────────────────────────────────────────────────────────
# page commands
# ──────────────────────────────────────────────────────────────────────

@main.group()
def page():
    """Page listing and scaffolding."""
    pass


@page.command("list")
@click.option("--role", default=None, help="Filter by role key (e.g. ops_manager)")
@click.option("--json", "use_json", is_flag=True)
def page_list(role, use_json):
    """List all pages in the app."""
    from cli_anything.vppapp.core.project import list_pages
    pages = list_pages(role)
    if use_json:
        _json_out({"pages": pages, "count": len(pages)})
        return
    skin.section(f"Pages ({len(pages)} total)")
    headers = ["Name", "Route", "Description", "Allowed Roles"]
    rows = [
        [p["name"], p["route"], p["description"][:40], ", ".join(p["allowed_roles"])[:30]]
        for p in pages
    ]
    skin.table(headers, rows)


@page.command("info")
@click.argument("name")
@click.option("--json", "use_json", is_flag=True)
def page_info(name, use_json):
    """Show details of a specific page."""
    from cli_anything.vppapp.core.project import get_page
    p = get_page(name)
    if p is None:
        if use_json:
            _json_out(f"Page '{name}' not found", success=False)
        else:
            skin.error(f"Page '{name}' not found")
        return
    if use_json:
        _json_out(p)
    else:
        skin.section(f"Page: {p['name']}")
        for k, v in p.items():
            skin.status(k, str(v))


@page.command("scaffold")
@click.argument("name")
@click.option("--route", required=True, help="Route path e.g. /my-page")
@click.option("--description", default="", help="Page description")
@click.option("--write", is_flag=True, help="Actually write the file (default: dry-run)")
@click.option("--json", "use_json", is_flag=True)
def page_scaffold(name, route, description, write, use_json):
    """Scaffold a new page component."""
    from cli_anything.vppapp.core.project import scaffold_page
    try:
        info = scaffold_page(name, route, description)
        if use_json:
            _json_out(info)
            return

        skin.section(f"Scaffold: {name}")
        skin.status("File", info["file_path"])
        skin.status("Route", route)

        if write:
            import os
            os.makedirs(info["page_dir"], exist_ok=True)
            with open(info["file_path"], "w", encoding="utf-8") as f:
                f.write(info["template"])
            skin.success(f"Created {info['file_path']}")
        else:
            skin.warning("Dry-run mode. Use --write to create the file.")
            skin.info("Template preview:")
            for line in info["template"].split("\n")[:20]:
                skin.hint(f"  {line}")

        skin.info("Next steps:")
        for step in info["next_steps"]:
            skin.hint(f"  - {step}")
    except ValueError as e:
        if use_json:
            _json_out(str(e), success=False)
        else:
            skin.error(str(e))


# ──────────────────────────────────────────────────────────────────────
# export commands
# ──────────────────────────────────────────────────────────────────────

@main.group()
def export():
    """Export mock data to JSON/CSV files."""
    pass


@export.command("all")
@click.option("--output", default="./export", help="Output directory")
@click.option("--format", "fmt", default="json", type=click.Choice(["json", "csv"]))
@click.option("--json", "use_json", is_flag=True)
def export_all_cmd(output, fmt, use_json):
    """Export all mock data stores."""
    from cli_anything.vppapp.core.export import export_all
    files = export_all(output, fmt)
    if use_json:
        _json_out({"exported_files": files, "count": len(files), "format": fmt})
        return
    skin.success(f"Exported {len(files)} files to {output}/")
    for f in files:
        skin.status("  File", f)


@export.command("devices")
@click.option("--output", default="./export")
@click.option("--format", "fmt", default="json", type=click.Choice(["json", "csv"]))
@click.option("--json", "use_json", is_flag=True)
def export_devices_cmd(output, fmt, use_json):
    """Export device data."""
    from cli_anything.vppapp.core.export import export_devices
    fp = export_devices(output, fmt)
    if use_json:
        _json_out({"file": fp, "format": fmt})
    else:
        skin.success(f"Devices exported to {fp}")


@export.command("tasks")
@click.option("--output", default="./export")
@click.option("--format", "fmt", default="json", type=click.Choice(["json", "csv"]))
@click.option("--json", "use_json", is_flag=True)
def export_tasks_cmd(output, fmt, use_json):
    """Export demand response task data."""
    from cli_anything.vppapp.core.export import export_tasks
    fp = export_tasks(output, fmt)
    if use_json:
        _json_out({"file": fp, "format": fmt})
    else:
        skin.success(f"Tasks exported to {fp}")


@export.command("market")
@click.option("--output", default="./export")
@click.option("--format", "fmt", default="json", type=click.Choice(["json", "csv"]))
@click.option("--json", "use_json", is_flag=True)
def export_market_cmd(output, fmt, use_json):
    """Export spot market price data."""
    from cli_anything.vppapp.core.export import export_market
    fp = export_market(output, fmt)
    if use_json:
        _json_out({"file": fp, "format": fmt})
    else:
        skin.success(f"Market data exported to {fp}")


@export.command("revenue")
@click.option("--output", default="./export")
@click.option("--format", "fmt", default="json", type=click.Choice(["json", "csv"]))
@click.option("--json", "use_json", is_flag=True)
def export_revenue_cmd(output, fmt, use_json):
    """Export revenue records."""
    from cli_anything.vppapp.core.export import export_revenue
    fp = export_revenue(output, fmt)
    if use_json:
        _json_out({"file": fp, "format": fmt})
    else:
        skin.success(f"Revenue data exported to {fp}")


# ──────────────────────────────────────────────────────────────────────
# status command
# ──────────────────────────────────────────────────────────────────────

@main.command("status")
@click.option("--json", "use_json", is_flag=True)
def app_status(use_json):
    """Show overall app status: project info, build, devices, tasks."""
    from cli_anything.vppapp.core.project import get_project_info, check_build_status
    from cli_anything.vppapp.core.devices import device_status_summary
    from cli_anything.vppapp.core.tasks import task_summary
    from cli_anything.vppapp.core.theme import get_theme
    from cli_anything.vppapp.utils.vppapp_backend import get_node_version

    info = get_project_info()
    build = check_build_status()
    devices = device_status_summary()
    tasks = task_summary()
    theme_cfg = get_theme()
    toolchain = get_node_version()

    result = {
        "project": info,
        "build": build,
        "devices": devices,
        "tasks": tasks,
        "theme": {"mode": theme_cfg["mode"], "tone": theme_cfg["tone"]},
        "toolchain": toolchain,
    }

    if use_json:
        _json_out(result)
        return

    skin.section("VPP App Status")
    skin.status("Project", info["name"])
    skin.status("Version", info["version"])
    skin.status("Path", info["project_path"])
    skin.status("Build", build["message"])
    skin.status("Devices", f"{devices['total']} total, {devices.get('在线',0)} online")
    skin.status("Tasks", f"{tasks['total']} total, {tasks.get('执行中',0)} active")
    skin.status("Theme", f"{theme_cfg['mode']}-{theme_cfg['tone']}")
    skin.status("Node", toolchain.get("node", "not found"))
    skin.status("npm", toolchain.get("npm", "not found"))


# ──────────────────────────────────────────────────────────────────────
# REPL mode
# ──────────────────────────────────────────────────────────────────────

def _run_repl():
    """Enter interactive REPL mode."""
    skin.print_banner()
    pt_session = skin.create_prompt_session()

    while True:
        try:
            user_input = skin.get_input(pt_session, context="vppapp")
            if not user_input:
                continue

            cmd = user_input.strip()
            if cmd.lower() in ("quit", "exit", "q"):
                skin.print_goodbye()
                break
            elif cmd.lower() in ("help", "?", "h"):
                _print_repl_help()
                continue

            # Parse and dispatch to Click
            try:
                args = shlex.split(cmd)
            except ValueError as e:
                skin.error(f"Parse error: {e}")
                continue

            try:
                main.main(args=args, standalone_mode=False)
            except SystemExit:
                pass
            except click.exceptions.UsageError as e:
                skin.error(str(e))
            except click.exceptions.NoSuchOption as e:
                skin.error(str(e))
            except Exception as e:
                skin.error(f"Error: {e}")

        except (KeyboardInterrupt, EOFError):
            skin.print_goodbye()
            break


def _print_repl_help():
    skin.help({
        "device list [--type TYPE] [--status STATUS]": "List devices",
        "device add --name N --type T --capacity C --location L": "Add device",
        "device update ID [--status S] [--soc N]": "Update device",
        "device remove ID": "Remove device",
        "device status": "Fleet status summary",
        "task list [--type T] [--status S]": "List demand response tasks",
        "task add --name N --type T --target-power MW --start T --end T": "Add task",
        "task update ID [--status S] [--progress N]": "Update task",
        "task cancel ID": "Cancel task",
        "task summary": "Task statistics",
        "market prices [--period P]": "Show 24h spot market prices",
        "market summary": "Market price statistics",
        "market strategy": "Charge/discharge strategy windows",
        "market regenerate": "Re-generate random market prices",
        "revenue records [--type T] [--status S]": "List revenue records",
        "revenue monthly": "Monthly revenue breakdown",
        "revenue add --date D --type T --power MW --duration H --unit-price P": "Add record",
        "revenue summary": "Revenue statistics",
        "theme get": "Show current theme",
        "theme set --mode M --tone T": "Set theme (dark/light, blue/green)",
        "theme list": "List all theme combinations",
        "build run": "npm run build",
        "build lint": "npm run lint",
        "build status": "Check dist/ directory",
        "build deps": "Check node_modules",
        "page list [--role R]": "List app pages",
        "page scaffold NAME --route /path": "Scaffold a new page",
        "export all [--format json|csv] [--output ./dir]": "Export all data",
        "status": "Show overall app status",
        "quit": "Exit REPL",
    })


if __name__ == "__main__":
    main()
