"""Run locally with an interactive terminal; never pass passwords as CLI arguments."""

from app.scripts.create_owner import main as create_owner


def main():
    print("create_admin is deprecated; running the owner bootstrap.")
    create_owner()


if __name__ == "__main__":
    main()
