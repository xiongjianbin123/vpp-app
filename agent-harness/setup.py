from setuptools import setup, find_namespace_packages

setup(
    name="cli-anything-vppapp",
    version="1.0.0",
    description="CLI harness for VPP App — Virtual Power Plant management platform",
    packages=find_namespace_packages(include=["cli_anything.*"]),
    install_requires=[
        "click>=8.0",
        "prompt_toolkit>=3.0",
    ],
    entry_points={
        "console_scripts": [
            "cli-anything-vppapp=cli_anything.vppapp.vppapp_cli:main",
        ],
    },
    python_requires=">=3.9",
)
