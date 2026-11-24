"""Small, dependency-free guard against committing common high-confidence secrets."""

import re
import subprocess
from pathlib import Path


def repository_root() -> Path:
    output = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"], check=True, capture_output=True, text=True
    ).stdout
    return Path(output.strip()).resolve()


def tracked_files(root: Path) -> list[Path]:
    output = subprocess.run(
        ["git", "ls-files", "-z"], check=True, capture_output=True, cwd=root
    ).stdout.decode("utf-8")
    return [Path(value) for value in output.split("\0") if value]


def main() -> int:
    root = repository_root()
    files = tracked_files(root)
    own_path = Path(__file__).resolve()
    forbidden_env = [
        path for path in files if path.name.startswith(".env") and path.name != ".env.example"
    ]
    findings = [f"tracked environment file: {path}" for path in forbidden_env]
    patterns = (
        re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
        re.compile(r"AKIA[0-9A-Z]{16}"),
        re.compile(r"gh[pousr]_[A-Za-z0-9]{36,}"),
    )
    for path in files:
        absolute = root / path
        if absolute.resolve() == own_path or not absolute.is_file():
            continue
        try:
            text = absolute.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        for pattern in patterns:
            if pattern.search(text):
                findings.append(f"high-confidence secret pattern: {path}")
                break
    if findings:
        print("\n".join(findings))
        return 1
    print("Tracked-file secret guard passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
