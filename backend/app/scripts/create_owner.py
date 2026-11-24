import sys
from getpass import getpass

from sqlalchemy import select

from app.auth.models import AdminUser
from app.auth.schemas import CreateAdminInput
from app.auth.security import create_user
from app.db import SessionLocal


def main() -> None:
    if not sys.stdin.isatty():
        raise SystemExit("Use an interactive terminal to enter the password securely.")
    with SessionLocal() as db:
        if db.scalar(select(AdminUser.id).where(AdminUser.role == "owner")):
            raise SystemExit("An owner already exists; a second owner is not allowed.")
        full_name = input("Full name: ").strip()
        email = input("Email: ").strip()
        password = getpass("Initial password (minimum 12 characters): ")
        confirmation = getpass("Confirm password: ")
        if password != confirmation:
            raise SystemExit("Passwords do not match.")
        try:
            owner = create_user(
                db,
                CreateAdminInput(
                    full_name=full_name,
                    email=email,
                    password=password,
                    role="owner",
                    must_change_password=True,
                ),
            )
        except Exception as exc:
            db.rollback()
            raise SystemExit(f"Owner was not created: {exc}") from exc
        print(
            f"Owner created for {owner.email}. Password was not displayed or stored in plaintext."
        )


if __name__ == "__main__":
    main()
