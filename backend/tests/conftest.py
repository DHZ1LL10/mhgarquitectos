import os

# Only a non-secret fallback for importing settings in isolated unit tests.
# Integration tests still require an explicitly selected PostgreSQL *_test DB.
os.environ.setdefault("DB_PASSWORD", "unit-test-only")
