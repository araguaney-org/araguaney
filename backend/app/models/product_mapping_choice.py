import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Index
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from app.database import Base


class ProductMappingChoice(Base):
    """El par (texto libre, producto elegido) que hoy no queda en ningún lado.

    Fase 23 pide un conjunto de ~100 casos reales por capacidad antes de poder
    encender el mapeo de texto con confianza; hoy no existe ninguno, porque
    nada persiste qué producto termina eligiendo una coordinación para el
    renglón que escribió quien dona. Esta tabla existe solo para eso: no
    decide nada, no cambia ningún flujo, únicamente acumula la verdad que
    `evals/run.py` necesita para dejar de medir contra casos escritos a mano.

    `suggested_product_type_ids` guarda lo que la IA propuso (vacío si nunca
    hubo sugerencia, p. ej. quien capturó buscó o creó el producto a mano):
    sin eso no se puede saber después si el modelo acertó en el top-1, en el
    top-3, o si de plano no tenía nada que ver.
    """

    __tablename__ = "product_mapping_choices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    free_text = Column(String, nullable=False)
    # El nombre de producto dentro del renglón (`alias_candidate`), ya
    # normalizado. Se guarda al registrar y no se recalcula al consultar para
    # que contar confirmaciones sea un `GROUP BY` indexado y no recorrer en
    # Python cada elección del producto. Vacío si el renglón no tenía un
    # nombre aprovechable: solo cantidades, o una frase entera.
    alias_candidate = Column(String, nullable=True)
    suggested_product_type_ids = Column(JSONB, nullable=False, default=list)

    # SET NULL, no CASCADE: si el producto elegido se archiva después, el
    # renglón histórico sigue contando como una elección real, solo que ya sin
    # decir cuál. Perder la fila perdería la métrica de ese día.
    chosen_product_type_id = Column(
        UUID(as_uuid=True), ForeignKey("product_types.id", ondelete="SET NULL"), nullable=True,
    )
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    center_id = Column(UUID(as_uuid=True), ForeignKey("centers.id", ondelete="SET NULL"), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Índices creados por migraciones. Se declaran aquí para que el modelo y
    # el esquema coincidan: sin esto, `alembic revision --autogenerate`
    # propone borrarlos. El CI lo vigila con `alembic check`.
    __table_args__ = (
        Index("ix_product_mapping_choices_created_at", "created_at"),
        Index(
            "ix_product_mapping_choices_product_candidate",
            "chosen_product_type_id",
            "alias_candidate",
        ),
    )
