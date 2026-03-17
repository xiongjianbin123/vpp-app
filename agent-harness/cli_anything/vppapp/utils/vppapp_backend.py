"""npm/node backend runner for VPP App CLI harness.

Wraps npm commands (build, dev, preview) as subprocess calls,
following the cli-anything methodology of using the real toolchain
as the "backend" (like libreoffice --headless).
"""

import shutil
import subprocess
import sys
from pathlib import Path
from cli_anything.vppapp.core.session import get_project_path


def find_npm() -> str:
    """Find npm executable. Raises RuntimeError if not found."""
    npm = shutil.which("npm")
    if not npm:
        raise RuntimeError(
            "npm not found. Install Node.js from https://nodejs.org/"
        )
    return npm


def find_node() -> str:
    """Find node executable."""
    node = shutil.which("node")
    if not node:
        raise RuntimeError("node not found. Install Node.js from https://nodejs.org/")
    return node


def get_node_version() -> dict:
    """Return node and npm version info."""
    result = {"node": None, "npm": None}
    try:
        node = find_node()
        r = subprocess.run([node, "--version"], capture_output=True, text=True, timeout=10)
        result["node"] = r.stdout.strip()
    except Exception as e:
        result["node_error"] = str(e)
    try:
        npm = find_npm()
        r = subprocess.run([npm, "--version"], capture_output=True, text=True, timeout=10)
        result["npm"] = r.stdout.strip()
    except Exception as e:
        result["npm_error"] = str(e)
    return result


def run_npm_command(command: str, project_path: Path = None, timeout: int = 300) -> dict:
    """Run an npm script command in the project directory.

    Args:
        command: npm script name (e.g. 'build', 'dev', 'preview', 'lint')
        project_path: Project root directory. Defaults to get_project_path().
        timeout: Timeout in seconds (default 300 = 5 min).

    Returns:
        Dict with returncode, stdout, stderr, command.
    """
    if project_path is None:
        project_path = get_project_path()

    npm = find_npm()
    cmd = [npm, "run", command]

    try:
        result = subprocess.run(
            cmd,
            cwd=str(project_path),
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return {
            "command": f"npm run {command}",
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "success": result.returncode == 0,
            "project_path": str(project_path),
        }
    except subprocess.TimeoutExpired:
        return {
            "command": f"npm run {command}",
            "returncode": -1,
            "stdout": "",
            "stderr": f"Command timed out after {timeout}s",
            "success": False,
            "project_path": str(project_path),
        }
    except Exception as e:
        return {
            "command": f"npm run {command}",
            "returncode": -1,
            "stdout": "",
            "stderr": str(e),
            "success": False,
            "project_path": str(project_path),
        }


def run_build(project_path: Path = None) -> dict:
    """Run npm run build (TypeScript check + Vite build)."""
    return run_npm_command("build", project_path, timeout=300)


def run_lint(project_path: Path = None) -> dict:
    """Run npm run lint (ESLint check)."""
    return run_npm_command("lint", project_path, timeout=120)


def run_dev(project_path: Path = None) -> dict:
    """Run npm run dev (starts Vite dev server). Note: this will block."""
    return run_npm_command("dev", project_path, timeout=30)


def run_preview(project_path: Path = None) -> dict:
    """Run npm run preview (preview built output)."""
    return run_npm_command("preview", project_path, timeout=30)


def find_git() -> str:
    """Find git executable. Raises RuntimeError if not found."""
    git = shutil.which("git")
    if not git:
        raise RuntimeError("git not found. Install git from https://git-scm.com/")
    return git


def git_status(project_path: Path = None) -> dict:
    """Return git status (branch, staged/unstaged/untracked files)."""
    if project_path is None:
        project_path = get_project_path()
    git = find_git()
    r = subprocess.run(
        [git, "status", "--porcelain"],
        cwd=str(project_path), capture_output=True, text=True, timeout=30,
    )
    lines = [l for l in r.stdout.splitlines() if l.strip()]
    staged   = [l[3:] for l in lines if l[0] in ("M", "A", "D", "R")]
    unstaged = [l[3:] for l in lines if l[1] in ("M", "D") and l[0] == " "]
    untracked = [l[3:] for l in lines if l[:2] == "??"]
    branch_r = subprocess.run(
        [git, "rev-parse", "--abbrev-ref", "HEAD"],
        cwd=str(project_path), capture_output=True, text=True, timeout=10,
    )
    remote_r = subprocess.run(
        [git, "remote", "get-url", "origin"],
        cwd=str(project_path), capture_output=True, text=True, timeout=10,
    )
    return {
        "branch": branch_r.stdout.strip(),
        "remote": remote_r.stdout.strip(),
        "staged": staged,
        "unstaged": unstaged,
        "untracked": untracked,
        "clean": len(lines) == 0,
    }


def git_deploy(project_path: Path = None, message: str = None,
               files: list = None, push: bool = True) -> dict:
    """Stage files, commit, and push to trigger GitHub Actions.

    Args:
        project_path: Repo root. Defaults to get_project_path().
        message: Commit message. Auto-generated if None.
        files: Specific files to stage. Defaults to all tracked changes.
        push: Whether to push after commit (default True).

    Returns:
        Dict with steps: add / commit / push — each with success/output.
    """
    if project_path is None:
        project_path = get_project_path()
    git = find_git()
    result = {"project_path": str(project_path), "steps": {}, "success": False}

    # Step 1: git add
    targets = files if files else ["."]
    add_r = subprocess.run(
        [git, "add"] + targets,
        cwd=str(project_path), capture_output=True, text=True, timeout=30,
    )
    result["steps"]["add"] = {
        "cmd": f"git add {' '.join(targets)}",
        "returncode": add_r.returncode,
        "success": add_r.returncode == 0,
        "stderr": add_r.stderr.strip(),
    }
    if add_r.returncode != 0:
        result["error"] = f"git add failed: {add_r.stderr.strip()}"
        return result

    # Check if anything staged
    diff_r = subprocess.run(
        [git, "diff", "--cached", "--name-only"],
        cwd=str(project_path), capture_output=True, text=True, timeout=10,
    )
    staged_files = [f for f in diff_r.stdout.splitlines() if f.strip()]
    if not staged_files:
        result["error"] = "nothing to commit (working tree clean)"
        result["steps"]["commit"] = {"success": False, "message": "nothing staged"}
        return result

    # Step 2: git commit
    if message is None:
        message = (
            f"chore: update mock data via cli-anything-vppapp "
            f"({len(staged_files)} file{'s' if len(staged_files) != 1 else ''})"
        )
    commit_r = subprocess.run(
        [git, "commit", "-m", message],
        cwd=str(project_path), capture_output=True, text=True, timeout=30,
    )
    result["steps"]["commit"] = {
        "cmd": f'git commit -m "{message}"',
        "returncode": commit_r.returncode,
        "success": commit_r.returncode == 0,
        "stdout": commit_r.stdout.strip(),
        "staged_files": staged_files,
    }
    if commit_r.returncode != 0:
        result["error"] = f"git commit failed: {commit_r.stderr.strip()}"
        return result

    # Step 3: git push
    if push:
        push_r = subprocess.run(
            [git, "push", "origin", "HEAD"],
            cwd=str(project_path), capture_output=True, text=True, timeout=60,
        )
        result["steps"]["push"] = {
            "cmd": "git push origin HEAD",
            "returncode": push_r.returncode,
            "success": push_r.returncode == 0,
            "stdout": push_r.stdout.strip(),
            "stderr": push_r.stderr.strip(),
        }
        if push_r.returncode != 0:
            result["error"] = f"git push failed: {push_r.stderr.strip()}"
            return result

    result["success"] = True
    result["committed_files"] = staged_files
    result["commit_message"] = message
    return result


def check_dependencies(project_path: Path = None) -> dict:
    """Check if node_modules exists and package.json is valid."""
    if project_path is None:
        project_path = get_project_path()

    node_modules = project_path / "node_modules"
    pkg_json = project_path / "package.json"

    result = {
        "project_path": str(project_path),
        "package_json_exists": pkg_json.exists(),
        "node_modules_exists": node_modules.exists(),
        "needs_install": not node_modules.exists(),
    }

    if not node_modules.exists():
        result["message"] = "Run: npm install"
    else:
        # Count packages as a quick sanity check
        try:
            packages = [d for d in node_modules.iterdir() if d.is_dir()]
            result["installed_packages"] = len(packages)
        except Exception:
            pass

    return result
