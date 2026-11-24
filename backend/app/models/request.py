import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, func, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Request(Base):
    __tablename__ = "requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    center_id = Column(UUID(as_uuid=True), ForeignKey("centers.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="OPEN")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    messages = relationship("RequestMessage", back_populates="request", cascade="all, delete-orphan")

    # Índices creados por migraciones. Se declaran aquí para que el modelo y
    # el esquema coincidan: sin esto, `alembic revision --autogenerate`
    # propone borrarlos. El CI lo vigila con `alembic check`.
    __table_args__ = (
        Index("ix_requests_center", "center_id"),
        Index("ix_requests_center_status_created", center_id, status, created_at.desc()),
        Index("ix_requests_status", "status"),
    )


class RequestMessage(Base):
    __tablename__ = "request_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("requests.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    request = relationship("Request", back_populates="messages")

    # Índices creados por migraciones. Se declaran aquí para que el modelo y
    # el esquema coincidan: sin esto, `alembic revision --autogenerate`
    # propone borrarlos. El CI lo vigila con `alembic check`.
    __table_args__ = (
        Index("ix_req_messages_request", "request_id"),
    )
