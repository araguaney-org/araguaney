"""Registra las elecciones reales de mapeo de texto libre (Fase 23, task 8) y
aprende de ellas otros nombres para el catálogo (Fase 28, task 6).

Registrar no decide nada: acumula el par (texto, producto elegido) para que
`evals/run.py` mida con datos de verdad en vez de casos escritos a mano.

Aprender sí escribe, y por eso va acotado. Cuando suficientes personas
distintas eligen el mismo producto para el mismo nombre, ese nombre se gradúa a
alias (`source='learned'`) y desde entonces el buscador y las sugerencias lo
encuentran. Es la respuesta a las marcas: los nombres que importan son los que
la gente teclea, y la plataforma ya los registra. El riesgo —empujar un nombre
hacia el producto equivocado repitiéndolo— se acota con tres cosas:

1. **Personas distintas**, en un número que vive solo en el entorno
   (`app/utils/alias_learning.py`). Sin valor, no se aprende nada.
2. **Visible y reversible**: el alias aparece en el panel del catálogo marcado
   como aprendido, y quitarlo deja una marca para que no vuelva solo.
3. **Nunca inventario**: un alias solo cambia qué se sugiere. Nada se sella sin
   que una persona lo mire.
"""

import logging
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.product_mapping_choice import ProductMappingChoice
from app.repositories.audit_repository import AuditRepository
from app.repositories.product_type_repository import ProductTypeRepository
from app.schemas.catalog_mapping_choice import CatalogMappingChoiceIn
from app.services.product_type_service import catalog_already_finds
from app.utils.alias_learning import min_distinct_users
from app.utils.text_matching import alias_candidate

logger = logging.getLogger(__name__)


class CatalogLearningService:

    def __init__(self, db: Session) -> None:
        self.db = db

    def record_mapping_choice(
        self,
        data: CatalogMappingChoiceIn,
        user_id: UUID | None,
        center_id: UUID | None,
    ) -> None:
        candidato = alias_candidate(data.free_text)
        self.db.add(ProductMappingChoice(
            free_text=data.free_text,
            alias_candidate=candidato,
            suggested_product_type_ids=[str(i) for i in data.suggested_product_type_ids],
            chosen_product_type_id=data.chosen_product_type_id,
            user_id=user_id,
            center_id=center_id,
        ))
        self.db.commit()

        if candidato:
            self._maybe_learn_alias(data.chosen_product_type_id, candidato)

    def _maybe_learn_alias(self, product_type_id: UUID, candidato: str) -> None:
        """Gradúa el nombre a alias si ya lo confirmaron suficientes personas.

        Corre después de guardar la elección y en su propia transacción: la
        elección ya quedó registrada pase lo que pase aquí. Aprender es un
        extra; perder el registro por un fallo al aprender no lo sería.
        """
        minimo = min_distinct_users()
        if minimo is None:
            return

        repo = ProductTypeRepository(self.db)
        try:
            producto = repo.find_by_id(product_type_id)
            if producto is None:
                return
            if repo.find_alias_by_text(product_type_id, candidato) is not None:
                return
            if repo.is_alias_rejected(product_type_id, candidato):
                return
            existentes = [a.alias for a in repo.list_aliases(product_type_id)]
            if catalog_already_finds(producto, candidato.split(), extra=existentes):
                return

            confirmaciones = repo.count_alias_confirmers(product_type_id, candidato)
            if confirmaciones < minimo:
                return

            repo.add_alias(
                product_type_id=product_type_id, alias=candidato, source="learned"
            )
            AuditRepository(self.db).log(
                "PRODUCT_ALIAS_LEARNED",
                "product_type",
                user_id=None,
                entity_id=str(product_type_id),
                extra={"alias": candidato, "confirmations": confirmaciones},
            )
            self.db.commit()
        except IntegrityError:
            # Dos elecciones simultáneas cruzaron el umbral a la vez y la otra
            # ya creó el alias: el resultado es el que se buscaba.
            self.db.rollback()
        except Exception:
            self.db.rollback()
            logger.exception("No se pudo aprender el alias de una elección de mapeo")
