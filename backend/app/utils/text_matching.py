"""Cómo se compara lo que alguien escribe contra el nombre de un producto.

Vive en `utils/` y no dentro de `services/ai/` porque tiene **dos**
consumidores: el shortlist que arma los candidatos para la IA
(`services/ai/text_mapping.py`) y el buscador de catálogo
(`repositories/product_type_repository.py`), que es el que usan el formulario
del panel y la aplicación móvil.

Que sean la misma regla no es prolijidad. Si el buscador y la IA normalizaran
distinto, teclear "frazadas" encontraría el producto por un camino y no por el
otro, y quien captura sufriría una incoherencia que no puede explicarse. Un
repositorio tampoco puede importar de un servicio sin invertir las capas, así
que la regla baja a donde los dos alcanzan.
"""

from __future__ import annotations

import re
import unicodedata

# Palabras funcionales del español: pasan el filtro de largo mínimo pero no
# dicen nada del producto, y al compararse por substring encuentran cualquier
# nombre que las contenga por casualidad ortográfica ("para" dentro de
# "comparativa"). Van sin acento porque se comparan ya normalizadas.
STOPWORDS = {
    "que", "para", "por", "con", "sin", "los", "las", "del", "una", "unos",
    "unas", "esa", "ese", "esta", "este", "sus", "mas", "pero", "como",
}

# Un plural en español agrega "s" o "es", así que dos formas de la misma
# palabra se llevan a lo más dos letras. Más allá de eso, que una esté dentro
# de la otra ya no dice que sean la misma palabra sino que coinciden por
# casualidad: "gel" dentro de "gelatina", "sal" dentro de "salchichas".
MAX_STEM_DELTA = 2

# Sobre texto ya normalizado no quedan acentos ni mayúsculas, así que separar
# corridas alfanuméricas basta — y de paso descarta la puntuación que traen
# varios nombres del catálogo: "(paquete)", "Gasa estéril 10x10 cm".
_WORD = re.compile(r"[a-z0-9]+")


def normalize(text: str) -> str:
    """Minúsculas y sin acentos, para que 'ATÚN' y 'atun' comparen igual.

    Quien captura con prisa no siempre teclea el acento, y el español lo usa
    donde no cambia a qué producto se refiere.
    """
    sin_acentos = "".join(
        c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c)
    )
    return sin_acentos.lower()


def words(text: str) -> list[str]:
    """Palabras que vale la pena comparar: normalizadas, sin puntuación, sin
    palabras funcionales, sin números sueltos y de al menos tres letras.

    La misma regla corre sobre el texto del donante y sobre el nombre del
    producto a propósito: dos lados que se comparan tienen que haber pasado
    por la misma normalización, o la comparación termina midiendo la
    diferencia entre las reglas y no entre las palabras.
    """
    return [
        palabra
        for palabra in _WORD.findall(normalize(text))
        if len(palabra) >= 3 and not palabra.isdigit() and palabra not in STOPWORDS
    ]


def shares_stem(word: str, catalog_words: set[str]) -> bool:
    """Si `word` es una variante de alguna palabra del producto.

    El español pluraliza agregando terminación ("cobija" -> "cobijas",
    "pañal" -> "pañales"), así que el singular queda dentro del plural. Se
    compara en los dos sentidos —por si el catálogo guarda el plural— y con
    un límite de longitud: sin él, toda palabra corta dentro de una larga
    contaría como variante.
    """
    for candidata in catalog_words:
        corta, larga = sorted((word, candidata), key=len)
        if len(larga) - len(corta) <= MAX_STEM_DELTA and corta in larga:
            return True
    return False


# Un renglón de donación que pasa de unas pocas palabras ya no es un nombre de
# producto sino una frase ("traigo cobijas y unas latas para los niños"), y
# graduarla a alias haría que cualquier búsqueda con esas palabras sueltas
# arrastrara al producto.
MAX_ALIAS_WORDS = 4

# Cómo viene empacado o cuánto es, no cómo se llama: "2 cajas de Bonafont" y
# "Bonafont 1 litro" piden lo mismo. Sin quitarlas, cada forma de contar sería
# un nombre distinto y las confirmaciones nunca se juntarían. Las de una o dos
# letras ("ml", "kg") ya las descarta `words`.
PACKAGING_WORDS = {
    "caja", "cajas", "paquete", "paquetes", "bolsa", "bolsas", "botella",
    "botellas", "frasco", "frascos", "lata", "latas", "sobre", "sobres",
    "pieza", "piezas", "pza", "pzas", "unidad", "unidades", "litro", "litros",
    "lts", "kilo", "kilos", "gramo", "gramos", "kgs", "grs",
}


def alias_candidate(free_text: str) -> str | None:
    """El nombre de producto que hay dentro de un renglón libre, o nada.

    Quien dona escribe "10 frazadas" o "advil 400mg"; el nombre es lo que queda
    al quitar cantidades y presentaciones. Se quita todo token con un dígito, no
    solo los números sueltos: "400mg" dice una concentración, no cómo se llama
    el producto, y una marca no identifica presentación ("advil" vale para
    400 y para 800).

    Devuelve las palabras ya normalizadas, en el orden en que se escribieron,
    para que dos personas que teclean "Frazadas" y "frazadas" cuenten como la
    misma confirmación.
    """
    sin_cantidades = [p for p in words(free_text) if not any(c.isdigit() for c in p)]
    # El largo se mide antes de quitar el empaque: una frase sigue siendo frase
    # aunque mencione botellas, y recortarla hasta que quepa la haría pasar
    # por nombre.
    if len(sin_cantidades) > MAX_ALIAS_WORDS:
        return None
    palabras = [p for p in sin_cantidades if p not in PACKAGING_WORDS]
    return " ".join(palabras) or None
