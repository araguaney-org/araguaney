import uuid
from sqlalchemy import Boolean, Column, Date, Numeric, String, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=True, index=True)  # public URL slug, e.g. /eventos/{slug}
    origin_country = Column(String(2), nullable=True)         # ISO 3166-1 alpha-2
    destination_country = Column(String(2), nullable=True)   # ISO 3166-1 alpha-2
    description = Column(String, nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, nullable=False, server_default="true")
    is_general = Column(Boolean, nullable=False, server_default="false")
    # Visibilidad publica explicita: hasta ahora bastaba con tener slug.
    is_public = Column(Boolean, nullable=False, server_default="false")
    weight_goal_kg = Column(Numeric(10, 3), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    # Índices creados por migraciones. Se declaran aquí para que el modelo y
    # el esquema coincidan: sin esto, `alembic revision --autogenerate`
    # propone borrarlos. El CI lo vigila con `alembic check`.
    __table_args__ = (
        Index("ix_campaigns_destination_country", "destination_country"),
        Index("ix_campaigns_is_active", "is_active"),
    )
