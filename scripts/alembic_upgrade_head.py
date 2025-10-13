#!/usr/bin/env python3
"""Run Alembic migrations to head"""

import subprocess
import os

os.chdir("backend")
subprocess.check_call(["alembic", "upgrade", "head"])
print("✅ Database migrations complete!")
