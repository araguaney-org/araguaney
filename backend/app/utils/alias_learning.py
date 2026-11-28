"""Cuántas personas distintas tienen que confirmar un nombre antes de que el
catálogo lo aprenda (Fase 28, task 6).

Graduar alias desde lo que la gente teclea es un camino de escritura **desde
texto de usuario hacia lo que el sistema propone**: alguien podría empujar
"paracetamol" hacia "botas" repitiéndolo. Exigir confirmaciones de personas
distintas lo acota, y que el alias aprendido sea visible y se pueda quitar
desde el panel lo vuelve reversible.

**El valor operativo vive solo en el entorno**, como el umbral de volumen de la
Fase 20: este repositorio es público, y un número publicado dice cuántas
cuentas hacen falta para envenenar una sugerencia. Sin valor, el aprendizaje
queda apagado y la captura funciona exactamente igual que antes.
"""

import os

_ENV = "ALIAS_LEARNING_MIN_USERS"

# Por debajo de dos, una sola persona enseñaría al catálogo de todos los
# centros. Ese valor no es un umbral sino la ausencia del control, así que se
# trata como apagado y no como "aprender a la primera".
_FLOOR = 2


def min_distinct_users() -> int | None:
    """Confirmaciones necesarias, o `None` si el aprendizaje está apagado.

    Una variable mal escrita apaga el aprendizaje en vez de romper la captura:
    registrar la elección es lo que importa, aprender de ella es un extra.
    """
    raw = os.environ.get(_ENV)
    if not raw:
        return None
    try:
        value = int(raw)
    except ValueError:
        return None
    return value if value >= _FLOOR else None
