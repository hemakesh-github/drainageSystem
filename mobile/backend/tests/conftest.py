import os

# Force in-memory SQLite for tests (overrides host DATABASE_URL).
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
