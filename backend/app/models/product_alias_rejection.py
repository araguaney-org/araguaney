import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class ProductAliasRejection(Base):
    """Un nombre que alguien quitó de un producto y que no debe volver solo.

    Sin esto, quitar un alias aprendido no serviría de nada: las elecciones que
    lo graduaron siguen en `product_mapping_choices`, y la siguiente captura
    con ese texto lo volvería a crear. Borrar es la forma de corregir el
    catálogo, y una corrección que se deshace sola no corrige nada.

    Se registra al quitar cualquier alias, no solo los aprendidos: uno sembrado
    que resultó equivocado tampoco debería volver por la vía del aprendizaje.
    Agregarlo a mano desde el panel sigue siendo posible, porque esa es una
    decisión explícita de una persona y no una inferencia.
    """

    __tablename__ = "product_alias_rejections"
    __table_args__ = (
        UniqueConstraint(
            "product_type_id", "normalized", name="uq_alias_rejection_per_product"
        ),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_type_id = Column(
        UUID(as_uuid=True),
        ForeignKey("product_types.id", ondelete="CASCADE"),
        nullable=False,
    )
    normalized = Column(String, nullable=False)
    rejected_by_user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
