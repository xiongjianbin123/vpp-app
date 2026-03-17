"""App project info and page listing for VPP App CLI harness."""

import json
import subprocess
from pathlib import Path
from cli_anything.vppapp.core.session import get_project_path

PAGES = [
    {
        "name": "Dashboard",
        "route": "/",
        "path": "src/pages/Dashboard/index.tsx",
        "description": "监控大屏 — 实时功率、告警、设备状态总览",
        "allowed_roles": ["sales_gm", "sales_manager", "trading_director", "trading_manager", "ops_manager"],
    },
    {
        "name": "Devices",
        "route": "/devices",
        "path": "src/pages/Devices/index.tsx",
        "description": "设备资产管理 — 储能、光伏、风电、充电桩设备列表与详情",
        "allowed_roles": ["sales_gm", "sales_manager", "trading_director", "ops_manager"],
    },
    {
        "name": "DemandResponse",
        "route": "/demand-response",
        "path": "src/pages/DemandResponse/index.tsx",
        "description": "需求响应 — 调峰/调频/备用任务管理与执行监控",
        "allowed_roles": ["sales_gm", "trading_director", "ops_manager"],
    },
    {
        "name": "SpotMarket",
        "route": "/spot-market",
        "path": "src/pages/SpotMarket/index.tsx",
        "description": "现货市场 — 分时电价、峰谷套利策略、96点申报",
        "allowed_roles": ["sales_gm", "trading_director", "trading_manager"],
    },
    {
        "name": "SmartBidding",
        "route": "/smart-bidding",
        "path": "src/pages/SmartBidding/index.tsx",
        "description": "智能申报 — AI辅助电力市场申报优化",
        "allowed_roles": ["sales_gm", "trading_director", "trading_manager"],
    },
    {
        "name": "ComplianceControl",
        "route": "/compliance-control",
        "path": "src/pages/ComplianceControl/index.tsx",
        "description": "合规管控 — 等保三级、AGC响应、申报合规监控",
        "allowed_roles": ["sales_gm", "ops_manager"],
    },
    {
        "name": "Revenue",
        "route": "/revenue",
        "path": "src/pages/Revenue/index.tsx",
        "description": "收益结算 — 月度收益图表、补贴结算记录",
        "allowed_roles": ["sales_gm", "sales_manager", "trading_director"],
    },
    {
        "name": "KnowledgeBase",
        "route": "/knowledge",
        "path": "src/pages/KnowledgeBase/index.tsx",
        "description": "知识库 — 行业新闻、政策文档、运营手册",
        "allowed_roles": ["sales_gm", "sales_manager", "trading_director", "trading_manager", "ops_manager"],
    },
    {
        "name": "InvestmentCalculator",
        "route": "/investment",
        "path": "src/pages/InvestmentCalculator/index.tsx",
        "description": "投资测算 — 储能项目投资回收期、IRR、NPV计算器",
        "allowed_roles": ["sales_gm", "sales_manager", "trading_director", "trading_manager", "ops_manager"],
    },
    {
        "name": "Login",
        "route": "/login",
        "path": "src/pages/Login/index.tsx",
        "description": "登录页 — 多角色 Mock 认证",
        "allowed_roles": [],
    },
]

USERS = [
    {"username": "admin",   "name": "李少雄", "role": "sales_gm",        "role_label": "售电总经理",   "password": "admin123"},
    {"username": "sales",   "name": "梁梓柔", "role": "sales_manager",   "role_label": "售电销售经理", "password": "sales123"},
    {"username": "trading", "name": "刘海",   "role": "trading_director","role_label": "电力交易总监", "password": "trade123"},
    {"username": "trader",  "name": "杜陈傲", "role": "trading_manager", "role_label": "电力交易经理", "password": "trader123"},
    {"username": "ops",     "name": "林伟权", "role": "ops_manager",     "role_label": "运维经理",     "password": "ops123"},
]


def get_project_info() -> dict:
    """Return project metadata."""
    project_path = get_project_path()
    pkg_json = project_path / "package.json"
    pkg_data = {}
    if pkg_json.exists():
        with open(pkg_json, encoding="utf-8") as f:
            pkg_data = json.load(f)

    return {
        "name": pkg_data.get("name", "vpp-app"),
        "version": pkg_data.get("version", "unknown"),
        "description": "虚拟电厂管理平台 — Virtual Power Plant Management",
        "project_path": str(project_path),
        "tech_stack": {
            "framework": "React 19 + TypeScript",
            "bundler": "Vite",
            "ui": "Ant Design 6",
            "charts": "Recharts",
            "router": "React Router v7 (HashRouter)",
            "deployment": "GitHub Pages",
        },
        "page_count": len([p for p in PAGES if p["name"] != "Login"]),
        "scripts": pkg_data.get("scripts", {}),
    }


def list_pages(role_filter: str = None) -> list:
    """List all pages, optionally filtered by role access."""
    pages = PAGES
    if role_filter:
        pages = [p for p in pages if role_filter in p["allowed_roles"]]
    return pages


def get_page(name: str) -> dict:
    """Return page info by name."""
    for p in PAGES:
        if p["name"].lower() == name.lower():
            return p
    return None


def list_users() -> list:
    """Return mock user list (sans passwords)."""
    return [
        {k: v for k, v in u.items() if k != "password"}
        for u in USERS
    ]


def check_build_status() -> dict:
    """Check if dist/ exists and is recent."""
    project_path = get_project_path()
    dist_dir = project_path / "dist"
    if not dist_dir.exists():
        return {"built": False, "dist_path": str(dist_dir), "message": "No dist/ directory found. Run: build run"}

    files = list(dist_dir.rglob("*"))
    if not files:
        return {"built": False, "dist_path": str(dist_dir), "message": "dist/ is empty"}

    import os, time
    latest_mtime = max(os.path.getmtime(str(f)) for f in files if f.is_file())
    age_seconds = time.time() - latest_mtime
    age_minutes = int(age_seconds / 60)

    return {
        "built": True,
        "dist_path": str(dist_dir),
        "file_count": len([f for f in files if f.is_file()]),
        "age_minutes": age_minutes,
        "message": f"Build exists, {age_minutes} minutes old",
    }


def scaffold_page(name: str, route: str, description: str = "") -> dict:
    """Generate a new page template following the existing project patterns."""
    project_path = get_project_path()
    page_dir = project_path / "src" / "pages" / name

    if page_dir.exists():
        raise ValueError(f"Page directory already exists: {page_dir}")

    template = f'''import {{ useState }} from 'react';
import {{ Row, Col, Card, Typography }} from 'antd';
import {{ useTheme }} from '../../context/ThemeContext';

const {{ Title, Text }} = Typography;

// {description or name + " page"}
export default function {name}() {{
  const {{ colors: c }} = useTheme();

  return (
    <div style={{{{ padding: '24px', background: c.bgPage, minHeight: '100vh' }}}}>
      <Row gutter={[16, 16]}>
        <Col span={{24}}>
          <Title level={{2}} style={{{{ color: c.textPrimary }}}}>
            {name}
          </Title>
          <Text style={{{{ color: c.textSecondary }}}}>
            {description or "Page description goes here."}
          </Text>
        </Col>
        <Col span={{24}}>
          <Card
            style={{{{
              background: c.bgCard,
              border: `1px solid ${{c.primaryBorder}}`,
            }}}}
          >
            <Text style={{{{ color: c.textMuted }}}}>
              Content coming soon...
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}}
'''
    return {
        "name": name,
        "route": route,
        "page_dir": str(page_dir),
        "file_path": str(page_dir / "index.tsx"),
        "template": template,
        "next_steps": [
            f"mkdir -p {page_dir}",
            f"Write template to {page_dir}/index.tsx",
            f"Add route '{route}' to src/App.tsx",
            f"Add nav item to src/components/Layout/",
        ],
    }
