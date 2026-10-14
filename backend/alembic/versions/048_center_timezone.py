"""Zona horaria del centro (Fase 27)

Un reporte dice "las cajas de hoy" y el día era UTC: para un centro en Tampa,
lo capturado a partir de las 20:00 caía en el día siguiente, y la regla de vida
útil medía contra ese día y no contra el de quien tenía la caja delante.

La columna es nullable y vacía significa UTC, así que ningún centro existente
cambia de comportamiento hasta que alguien capture su zona.

Revision ID: 048
Revises: 047
"""

import sqlalchemy as sa
from alembic import op

revision = "048"
down_revision = "047"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("centers", sa.Column("timezone", sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column("centers", "timezone")
