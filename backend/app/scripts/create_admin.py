"""Run locally with an interactive terminal; never pass passwords as CLI arguments."""

import argparse
import sys
from getpass import getpass

from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

from app import models  # noqa: F401
from app.auth.schemas import CreateAdminInput
from app.auth.security import create_user
from app.db import SessionLocal


def main():
    parser = argparse.ArgumentParser(
        description="Create an administrative user (no public registration)"
    )
    parser.add_argument("--role", choices=("admin", "staff"), default="admin")
    args = parser.parse_args()
    if not sys.stdin.isatty():
        raise SystemExit("Use an interactive terminal to enter the password securely")
    email = input("Email: ").strip()
    full_name = input("Full name: ").strip()
    password = getpass("Password (12-128 characters): ")
    if password != getpass("Confirm password: "):
        raise SystemExit("Passwords do not match")
    try:
        payload = CreateAdminInput(
            email=email, full_name=full_name, password=password, role=args.role
        )
        with SessionLocal() as db:
            create_user(db, payload)
    except ValidationError:
        raise SystemExit("Invalid email, name or password length") from None
    except (ValueError, IntegrityError):
        raise SystemExit("User already exists; no existing credentials were changed") from None
    print("Administrative user created")


if __name__ == "__main__":
    main()
