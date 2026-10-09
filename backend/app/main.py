import logging
import time
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app import models  # noqa: F401 - register all mappings
from app.admin.router import router as management_router
from app.appointments.router import router as appointments_router
from app.auth.router import router as auth_router
from app.config import get_settings
from app.dependencies import Database
from app.errors import install_error_handlers
from app.kitchen_configurations.router import router as kitchens_router
from app.kitchen_configurations.submissions import router as submissions_router
from app.leads.router import router as leads_router
from app.properties.router import admin_router, public_router

settings = get_settings()
logging.basicConfig(
    level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s %(message)s"
)
logger = logging.getLogger("mhg")
app = FastAPI(
    title="MHG Arquitectos API",
    version="1.0.0",
    description="Modular monolith with revocable administrative sessions.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type", "X-MHG-Admin", "Idempotency-Key"],
    allow_credentials=True,
)
install_error_handlers(app)


@app.middleware("http")
async def request_log(request: Request, call_next):
    request_id = str(uuid4())
    started = time.monotonic()
    response = await call_next(request)
    route = request.scope.get("route")
    logger.info(
        "request id=%s method=%s route=%s status=%d duration_ms=%.1f",
        request_id,
        request.method,
        getattr(route, "path", "<unmatched>"),
        response.status_code,
        (time.monotonic() - started) * 1000,
    )
    response.headers["X-Request-ID"] = request_id
    if request.url.path.startswith("/api/v1/"):
        response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/health", tags=["Health"])
def health(db: Database):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}


for router in (
    auth_router,
    management_router,
    public_router,
    admin_router,
    kitchens_router,
    appointments_router,
    leads_router,
    submissions_router,
):
    app.include_router(router, prefix="/api/v1")
