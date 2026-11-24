import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

PALLET_STATUSES = ("OPEN", "CLOSED", "SHIPPED")


class Pallet(Base):
    __tablename__ = "pallets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String, nullable=False, unique=True, index=True)
    center_id = Column(UUID(as_uuid=True), ForeignKey("centers.id", ondelete="CASCADE"), nullable=False, index=True)
    shipment_id = Column(UUID(as_uuid=True), ForeignKey("shipments.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String, nullable=False, server_default="OPEN")
    notes = Column(String, nullable=True)
    tare_weight_kg = Column(Numeric(8, 3), nullable=True)
    # Peso de báscula al cerrar (Fase 21). Cuando existe manda sobre la suma de
    # estimados de las cajas: es el que la cadena aérea valida.
    gross_weight_kg = Column(Numeric(8, 3), nullable=True)
    height_cm = Column(Integer, nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    # Índices creados por migraciones. Se declaran aquí para que el modelo y
    # el esquema coincidan: sin esto, `alembic revision --autogenerate`
    # propone borrarlos. El CI lo vigila con `alembic check`.
    __table_args__ = (
        Index("ix_pallets_center_status", "center_id", "status"),
        Index("ix_pallets_center_status_created", center_id, status, created_at.desc()),
    )
