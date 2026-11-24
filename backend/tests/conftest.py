import os

# Minimal env vars required by app.config.Settings before any import.
# These are never used for real operations in unit tests.
# La URL apunta al puerto 1, donde nunca escucha nada: el código que use el
# engine global por error falla siempre igual ("connection refused"), haya o no
# un Postgres en el puerto por defecto (el job de CI levanta uno en el 5432).
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@127.0.0.1:1/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-unit-tests-only-32-chars")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")
