import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func, Index
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=True)
    extra = Column("metadata", JSONB, nullable=True)
    ip = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Índices creados por migraciones. Se declaran aquí para que el modelo y
    # el esquema coincidan: sin esto, `alembic revision --autogenerate`
    # propone borrarlos. El CI lo vigila con `alembic check`.
    __table_args__ = (
        Index("ix_audit_created", "created_at"),
        Index("ix_audit_entity", "entity_type", "entity_id"),
        Index("ix_audit_entity_created", entity_type, created_at.desc()),
        Index("ix_audit_user", "user_id"),
    )
