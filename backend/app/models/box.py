import uuid
from sqlalchemy import Column, String, DateTime, Date, Integer, Numeric, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

BOX_STATUSES = ("DRAFT", "SEALED", "SHIPPED", "REJECTED")


class Box(Base):
    __tablename__ = "boxes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String, nullable=False, unique=True, index=True)
    center_id = Column(UUID(as_uuid=True), ForeignKey("centers.id", ondelete="CASCADE"), nullable=False, index=True)
    product_type_id = Column(UUID(as_uuid=True), ForeignKey("product_types.id", ondelete="RESTRICT"), nullable=False, index=True)
    intake_id = Column(UUID(as_uuid=True), ForeignKey("intakes.id", ondelete="SET NULL"), nullable=True, index=True)
    pallet_id = Column(UUID(as_uuid=True), ForeignKey("pallets.id", ondelete="SET NULL"), nullable=True, index=True)
    quantity = Column(Integer, nullable=False)
    unit = Column(String, nullable=False)
    batch = Column(String, nullable=True)
    expiry_date = Column(Date, nullable=True)
    weight_kg = Column(Numeric(10, 3), nullable=True)
    status = Column(String, nullable=False, server_default="DRAFT")
    reject_reason = Column(String, nullable=True)
    sealed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=True, onupdate=func.now())

    # Índices creados por migraciones. Se declaran aquí para que el modelo y
    # el esquema coincidan: sin esto, `alembic revision --autogenerate`
    # propone borrarlos. El CI lo vigila con `alembic check`.
    __table_args__ = (
        Index("ix_boxes_center_status", "center_id", "status"),
        Index("ix_boxes_center_status_created", center_id, status, created_at.desc()),
        Index("ix_boxes_pt_status", "product_type_id", "status"),
        Index("ix_boxes_sealed_center_covering", "center_id", postgresql_include=["quantity", "weight_kg"], postgresql_where=(status == "SEALED"), sqlite_where=(status == "SEALED")),
        Index("ix_boxes_status", "status"),
    )
