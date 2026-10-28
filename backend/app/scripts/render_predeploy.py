"""Run Render pre-deploy database migration checks without shell chaining."""

from alembic import command
from alembic.config import Config


def main() -> None:
    config = Config("alembic.ini")

    print("Render pre-deploy: upgrading database to head", flush=True)
    command.upgrade(config, "head")

    print("Render pre-deploy: current revision", flush=True)
    command.current(config)

    print("Render pre-deploy: checking for pending migration operations", flush=True)
    command.check(config)

    print("Render pre-deploy: migration checks complete", flush=True)


if __name__ == "__main__":
    main()
