import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

# El envío ya no muere en SHIPPED (Fase 22): DELIVERED es "llegó" y
# RECONCILED es "se registró qué llegó, caja por caja".
SHIPMENT_STATUSES = ("OPEN", "CLOSED", "SHIPPED", "DELIVERED", "RECONCILED")


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    center_id = Column(UUID(as_uuid=True), ForeignKey("centers.id", ondelete="SET NULL"), nullable=True, index=True)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True, index=True)
    destination = Column(String, nullable=False, server_default="Venezuela")
    carrier = Column(String, nullable=True)
    reference = Column(String, nullable=True)
    status = Column(String, nullable=False, server_default="OPEN")
    notes = Column(String, nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    reconciled_at = Column(DateTime(timezone=True), nullable=True)
    # Restricción de altura declarada por el envío (Fase 21). Se advierte, no
    # se bloquea: quien está en el andén ve la tarima y el sistema no.
    height_profile = Column(String, nullable=True)
    # Perfil de país para la declaración de mercancías, si aplica. Sin perfil,
    # el documento sale con nombres de campo universales.
    declaration_profile = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    # Índices creados por migraciones. Se declaran aquí para que el modelo y
    # el esquema coincidan: sin esto, `alembic revision --autogenerate`
    # propone borrarlos. El CI lo vigila con `alembic check`.
    __table_args__ = (
        Index("ix_shipments_center_status_created", center_id, status, created_at.desc()),
        Index("ix_shipments_status", "status"),
    )
