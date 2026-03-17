"""Device mock data CRUD for VPP App CLI harness.

Mirrors the Device interface from src/mock/data.ts.
Data is stored at ~/.cli-anything-vppapp/data/devices.json
"""

import uuid
from typing import Optional
from cli_anything.vppapp.core.session import ensure_seeded, save_store

STORE_NAME = "devices"

VALID_TYPES = ["光伏电站", "储能系统", "风电", "充电桩", "工业负荷", "电网储能"]
VALID_STATUSES = ["在线", "离线", "维护", "告警"]


def _seed_devices() -> list:
    """Default seed data mirroring src/mock/data.ts mockDevices."""
    return [
        {
            "id": "E001", "name": "富山站储能", "type": "电网储能", "status": "在线",
            "capacity": 150, "energyCapacity": 300, "currentPower": 86.4, "soc": 65,
            "location": "广州市番禺区石壁街道", "lastUpdate": "2026-03-16 10:30:00",
            "station": "富山站",
            "projectName": "广州市番禺区富山220kV变电站150MW/300MWh新型独立储能项目",
            "company": "广州颐海能源科技有限公司",
            "connectionType": "IEC61850协议", "batteryType": "LFP磷酸铁锂",
            "batterySpec": "314Ah / 3.2V", "bmsModel": "科陆电子 BMS-3000",
            "pcsModel": "阳光电源 SG3125HV", "emsModel": "汇图EMS V2.1",
            "investmentCost": 43500, "commissionDate": "2025-06-15", "warrantyYears": 10,
            "soh": 97, "cycleCount": 312,
            "maxCellVoltage": 3284, "minCellVoltage": 3271,
            "cellMaxTemp": 31.2, "cellMinTemp": 28.5,
            "temperature": 26.3, "humidity": 58, "bmsAlarms": [],
        },
        {
            "id": "E002", "name": "聚龙站储能", "type": "电网储能", "status": "在线",
            "capacity": 150, "energyCapacity": 300, "currentPower": 72.0, "soc": 71,
            "location": "广州市番禺区石壁街道钟韦路63号", "lastUpdate": "2026-03-16 10:30:00",
            "station": "聚龙站",
            "projectName": "广州市番禺区聚龙220kV变电站150MW/300MWh新型独立储能项目",
            "company": "广州颐投能源科技有限公司",
            "connectionType": "IEC61850协议", "batteryType": "LFP磷酸铁锂",
            "investmentCost": 43500, "commissionDate": "2025-07-20", "warrantyYears": 10,
            "soh": 96, "cycleCount": 287, "bmsAlarms": [],
        },
        {
            "id": "E003", "name": "厚德站储能", "type": "电网储能", "status": "在线",
            "capacity": 100, "energyCapacity": 200, "currentPower": 48.5, "soc": 58,
            "location": "广州市海珠区华洲街道土华村", "lastUpdate": "2026-03-16 10:30:00",
            "station": "厚德站",
            "projectName": "广州市海珠区100MW/200MWh新型独立储能项目",
            "company": "广州颐滨能源科技有限公司",
            "soh": 95, "cycleCount": 423,
            "bmsAlarms": ["单体温差偏大（3.2°C），建议检查散热风道"],
        },
        {
            "id": "E005", "name": "科城站储能", "type": "电网储能", "status": "在线",
            "capacity": 200, "energyCapacity": 400, "currentPower": 118.6, "soc": 44,
            "location": "广州市黄埔区联和街道", "lastUpdate": "2026-03-16 10:30:00",
            "station": "科城站",
            "projectName": "广州市黄埔区新型独立储能（200MW/400MWh）项目",
            "company": "广东颐禾能源投资有限公司",
            "investmentCost": 58000, "commissionDate": "2025-09-01",
            "soh": 99, "cycleCount": 198, "bmsAlarms": [],
        },
        {
            "id": "D001", "name": "光伏电站-北区", "type": "光伏电站", "status": "在线",
            "capacity": 50, "currentPower": 38.5, "location": "北京市朝阳区",
            "lastUpdate": "2026-03-14 10:30:00",
            "connectionType": "MODBUS TCP", "commissionDate": "2022-05-01", "investmentCost": 15000,
        },
        {
            "id": "D002", "name": "储能系统-A", "type": "储能系统", "status": "在线",
            "capacity": 20, "energyCapacity": 40, "currentPower": 15.2, "location": "北京市海淀区",
            "lastUpdate": "2026-03-14 10:30:00",
            "soc": 72, "soh": 88, "connectionType": "MODBUS TCP",
            "batteryType": "LFP磷酸铁锂", "investmentCost": 4800,
            "bmsAlarms": ["SOH低于90%，建议安排电池健康诊断"],
        },
        {
            "id": "D004", "name": "充电桩群-CBD", "type": "充电桩", "status": "告警",
            "capacity": 5, "currentPower": 0, "location": "北京市西城区",
            "lastUpdate": "2026-03-14 10:28:00",
            "connectionType": "OCPP 1.6", "investmentCost": 800,
        },
        {
            "id": "D005", "name": "工业负荷-钢厂", "type": "工业负荷", "status": "在线",
            "capacity": 40, "currentPower": 32.0, "location": "河北省唐山市",
            "lastUpdate": "2026-03-14 10:30:00",
            "connectionType": "电表直采", "investmentCost": 200,
        },
        {
            "id": "D008", "name": "风电场-西区", "type": "风电", "status": "离线",
            "capacity": 20, "currentPower": 0, "location": "张家口市",
            "lastUpdate": "2026-03-14 08:15:00",
            "connectionType": "风机通讯协议", "investmentCost": 12000,
        },
    ]


def _get_devices() -> list:
    return ensure_seeded(STORE_NAME, _seed_devices)


def list_devices(
    type_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
) -> list:
    """Return all devices, optionally filtered."""
    devices = _get_devices()
    if type_filter:
        devices = [d for d in devices if d.get("type") == type_filter]
    if status_filter:
        devices = [d for d in devices if d.get("status") == status_filter]
    return devices


def get_device(device_id: str) -> Optional[dict]:
    """Return a single device by id."""
    for d in _get_devices():
        if d["id"] == device_id:
            return d
    return None


def add_device(
    name: str,
    device_type: str,
    capacity: float,
    location: str,
    status: str = "在线",
    **kwargs,
) -> dict:
    """Add a new device and persist it."""
    if device_type not in VALID_TYPES:
        raise ValueError(f"Invalid type '{device_type}'. Choose from: {VALID_TYPES}")
    if status not in VALID_STATUSES:
        raise ValueError(f"Invalid status '{status}'. Choose from: {VALID_STATUSES}")

    from datetime import datetime
    devices = _get_devices()

    # Auto-generate ID
    prefix = "E" if device_type == "电网储能" else "D"
    existing = [d["id"] for d in devices if d["id"].startswith(prefix)]
    next_num = len(existing) + 1
    device_id = f"{prefix}{next_num:03d}"
    # Ensure uniqueness
    while any(d["id"] == device_id for d in devices):
        next_num += 1
        device_id = f"{prefix}{next_num:03d}"

    device = {
        "id": device_id,
        "name": name,
        "type": device_type,
        "status": status,
        "capacity": capacity,
        "currentPower": kwargs.get("currentPower", 0.0),
        "location": location,
        "lastUpdate": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }
    # Optional fields
    for field in [
        "energyCapacity", "soc", "soh", "connectionType", "batteryType",
        "batterySpec", "bmsModel", "pcsModel", "emsModel",
        "investmentCost", "commissionDate", "warrantyYears",
        "station", "projectName", "company",
    ]:
        if field in kwargs:
            device[field] = kwargs[field]

    device.setdefault("bmsAlarms", [])
    devices.append(device)
    save_store(STORE_NAME, devices)
    return device


def update_device(device_id: str, **kwargs) -> Optional[dict]:
    """Update fields on an existing device."""
    from datetime import datetime
    devices = _get_devices()
    for d in devices:
        if d["id"] == device_id:
            for k, v in kwargs.items():
                if v is not None:
                    d[k] = v
            d["lastUpdate"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            save_store(STORE_NAME, devices)
            return d
    return None


def remove_device(device_id: str) -> bool:
    """Remove a device by id. Returns True if found and removed."""
    devices = _get_devices()
    new_devices = [d for d in devices if d["id"] != device_id]
    if len(new_devices) == len(devices):
        return False
    save_store(STORE_NAME, new_devices)
    return True


def device_status_summary() -> dict:
    """Return counts by status."""
    devices = _get_devices()
    summary = {"total": len(devices)}
    for s in VALID_STATUSES:
        summary[s] = sum(1 for d in devices if d.get("status") == s)
    summary["total_capacity_mw"] = sum(d.get("capacity", 0) for d in devices)
    summary["online_power_mw"] = sum(
        d.get("currentPower", 0) for d in devices if d.get("status") == "在线"
    )
    return summary
