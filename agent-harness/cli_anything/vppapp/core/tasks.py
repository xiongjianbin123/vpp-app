"""Demand Response Tasks CRUD for VPP App CLI harness.

Mirrors the DemandResponseTask interface from src/mock/data.ts.
Data stored at ~/.cli-anything-vppapp/data/tasks.json
"""

from typing import Optional
from cli_anything.vppapp.core.session import ensure_seeded, save_store

STORE_NAME = "tasks"

VALID_TYPES = ["调峰", "调频", "备用"]
VALID_STATUSES = ["待响应", "执行中", "已完成", "已取消"]


def _seed_tasks() -> list:
    return [
        {
            "id": "T001", "name": "高峰调峰任务-01", "type": "调峰", "status": "执行中",
            "targetPower": 50, "currentPower": 42.3,
            "startTime": "2026-03-14 09:00", "endTime": "2026-03-14 12:00",
            "progress": 65, "reward": 125000,
        },
        {
            "id": "T002", "name": "频率调节任务-A", "type": "调频", "status": "待响应",
            "targetPower": 30, "currentPower": 0,
            "startTime": "2026-03-14 14:00", "endTime": "2026-03-14 16:00",
            "progress": 0, "reward": 80000,
        },
        {
            "id": "T003", "name": "备用容量响应-03", "type": "备用", "status": "已完成",
            "targetPower": 20, "currentPower": 20,
            "startTime": "2026-03-13 20:00", "endTime": "2026-03-14 08:00",
            "progress": 100, "reward": 56000,
        },
        {
            "id": "T004", "name": "夜间调峰任务-02", "type": "调峰", "status": "已完成",
            "targetPower": 40, "currentPower": 40,
            "startTime": "2026-03-13 22:00", "endTime": "2026-03-14 06:00",
            "progress": 100, "reward": 98000,
        },
        {
            "id": "T005", "name": "应急调频任务-B", "type": "调频", "status": "待响应",
            "targetPower": 25, "currentPower": 0,
            "startTime": "2026-03-14 16:00", "endTime": "2026-03-14 18:00",
            "progress": 0, "reward": 62000,
        },
    ]


def _get_tasks() -> list:
    return ensure_seeded(STORE_NAME, _seed_tasks)


def list_tasks(
    type_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
) -> list:
    """Return tasks, optionally filtered by type and/or status."""
    tasks = _get_tasks()
    if type_filter:
        tasks = [t for t in tasks if t.get("type") == type_filter]
    if status_filter:
        tasks = [t for t in tasks if t.get("status") == status_filter]
    return tasks


def get_task(task_id: str) -> Optional[dict]:
    for t in _get_tasks():
        if t["id"] == task_id:
            return t
    return None


def add_task(
    name: str,
    task_type: str,
    target_power: float,
    start_time: str,
    end_time: str,
    reward: float = 0,
    status: str = "待响应",
) -> dict:
    """Create a new demand response task."""
    if task_type not in VALID_TYPES:
        raise ValueError(f"Invalid type '{task_type}'. Choose from: {VALID_TYPES}")
    if status not in VALID_STATUSES:
        raise ValueError(f"Invalid status '{status}'. Choose from: {VALID_STATUSES}")

    tasks = _get_tasks()
    next_num = len(tasks) + 1
    task_id = f"T{next_num:03d}"
    while any(t["id"] == task_id for t in tasks):
        next_num += 1
        task_id = f"T{next_num:03d}"

    task = {
        "id": task_id,
        "name": name,
        "type": task_type,
        "status": status,
        "targetPower": target_power,
        "currentPower": 0,
        "startTime": start_time,
        "endTime": end_time,
        "progress": 0,
        "reward": reward,
    }
    tasks.append(task)
    save_store(STORE_NAME, tasks)
    return task


def update_task(task_id: str, **kwargs) -> Optional[dict]:
    """Update fields on an existing task."""
    tasks = _get_tasks()
    for t in tasks:
        if t["id"] == task_id:
            for k, v in kwargs.items():
                if v is not None:
                    t[k] = v
            save_store(STORE_NAME, tasks)
            return t
    return None


def cancel_task(task_id: str) -> Optional[dict]:
    """Set a task status to 已取消."""
    return update_task(task_id, status="已取消")


def remove_task(task_id: str) -> bool:
    """Remove a task by id."""
    tasks = _get_tasks()
    new_tasks = [t for t in tasks if t["id"] != task_id]
    if len(new_tasks) == len(tasks):
        return False
    save_store(STORE_NAME, new_tasks)
    return True


def task_summary() -> dict:
    """Return counts and total reward by status."""
    tasks = _get_tasks()
    result = {"total": len(tasks)}
    for s in VALID_STATUSES:
        result[s] = sum(1 for t in tasks if t.get("status") == s)
    result["total_reward"] = sum(t.get("reward", 0) for t in tasks)
    result["active_power_mw"] = sum(
        t.get("currentPower", 0) for t in tasks if t.get("status") == "执行中"
    )
    return result
