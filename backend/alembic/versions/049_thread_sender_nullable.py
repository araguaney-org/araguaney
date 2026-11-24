"""El remitente de un hilo puede quedar vacío, como dice su llave foránea

`threads.sender_id` se creó en la 015 como `NOT NULL` y, a la vez, con
`ON DELETE SET NULL`. Las dos reglas se contradicen: si algún día se borrara de
verdad un usuario que envió un hilo, Postgres intentaría poner `NULL` en una
columna que no lo admite y el borrado fallaría. Hoy no ocurre porque borrar una
cuenta la anonimiza en vez de quitar la fila, pero la contradicción quedaba
escrita para el primero que lo intentara.

La intención es la de la llave foránea y la del modelo (`Mapped[uuid.UUID |
None]`): el hilo sobrevive a quien lo abrió. Quitar el `NOT NULL` solo cambia
metadatos, no reescribe la tabla.

Revision ID: 049
Revises: 048
"""

from alembic import op

revision = "049"
down_revision = "048"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("threads", "sender_id", nullable=True)


def downgrade() -> None:
    # Volver a NOT NULL falla si ya hay hilos sin remitente; es el precio de
    # deshacer, y es mejor que fallar en silencio con datos que no caben.
    op.alter_column("threads", "sender_id", nullable=False)
