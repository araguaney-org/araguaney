"""Alias aprendidos de la captura (Fase 28, task 6)

Dos piezas:

- `product_mapping_choices.alias_candidate`: el nombre de producto dentro del
  renglón que escribió quien dona, ya normalizado. Contar cuántas personas
  distintas confirmaron el mismo par (nombre, producto) es entonces un
  `GROUP BY` indexado. Las filas que ya existían se rellenan con la misma regla
  que usa la aplicación, para que lo capturado antes de esta migración cuente.
- `product_alias_rejections`: los nombres que alguien quitó de un producto.
  Sin esto, la siguiente captura volvería a graduar el alias que se acaba de
  quitar.

Revision ID: 050
Revises: 049
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

from app.utils.text_matching import alias_candidate

revision = "050"
down_revision = "049"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "product_mapping_choices", sa.Column("alias_candidate", sa.String(), nullable=True)
    )
    op.create_index(
        "ix_product_mapping_choices_product_candidate",
        "product_mapping_choices",
        ["chosen_product_type_id", "alias_candidate"],
    )

    conn = op.get_bind()
    filas = conn.execute(sa.text("SELECT id, free_text FROM product_mapping_choices")).fetchall()
    for fila_id, free_text in filas:
        candidato = alias_candidate(free_text or "")
        if candidato:
            conn.execute(
                sa.text("UPDATE product_mapping_choices SET alias_candidate = :c WHERE id = :i"),
                {"c": candidato, "i": fila_id},
            )

    op.create_table(
        "product_alias_rejections",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "product_type_id",
            UUID(as_uuid=True),
            sa.ForeignKey("product_types.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("normalized", sa.String(), nullable=False),
        sa.Column(
            "rejected_by_user_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.UniqueConstraint(
            "product_type_id", "normalized", name="uq_alias_rejection_per_product"
        ),
    )


def downgrade() -> None:
    op.drop_table("product_alias_rejections")
    op.drop_index(
        "ix_product_mapping_choices_product_candidate", table_name="product_mapping_choices"
    )
    op.drop_column("product_mapping_choices", "alias_candidate")
