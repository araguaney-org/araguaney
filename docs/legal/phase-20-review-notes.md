# Fase 20: notas para la revisión legal

> Acompaña a los borradores de `frontend/src/content/legal/drafts/`. Ninguno se
> publica ni se enlaza hasta que un abogado con práctica en México los revise
> (Fase 20, task 7). Una prueba (`src/lib/__tests__/legal-drafts.test.ts`)
> falla si algo que se sirve llega a importarlos.

## Qué hay que revisar

| Borrador | Qué es | Dónde termina |
|---|---|---|
| `donation-terms.{es,en}.ts` | Términos de Donación en Especie: las 7 cláusulas del spec, más datos de la persona donante y versiones | Página pública propia, enlazada desde la casilla de aceptación de `/donar` y desde la captura en ventanilla |
| `platform-disclaimer.{es,en}.ts` | Exención de responsabilidad de la plataforma: tres secciones | Dentro de los Términos y Condiciones vigentes, después de "Qué es Araguaney" |
| `acceptance-policy.{es,en}.ts` | Política de Aceptación de Donaciones: corta, para quien dona | Página pública propia |

La fuente del contenido es el spec
`docs/superpowers/specs/2026-07-29-risk-prevention-design.md`. Aquí solo se
anota lo que la redacción decidió y lo que conviene que el abogado mire.

## Dónde el borrador se aparta del spec, y por qué

1. **Cláusula 1 no cita el Código Civil Federal.** El spec habla de "la figura
   del Código Civil Federal mexicano para donación pura". El borrador dice "en
   los términos que la ley aplicable reconoce a la donación pura". Araguaney
   opera en varios países y los centros no son todos mexicanos; citar un código
   concreto ataría el texto a uno solo. **Pregunta:** ¿basta la referencia
   genérica, o conviene citar el CCF para los centros en México y dejar la
   genérica para el resto?
2. **Cláusula 7 ya no dice que los centros no emiten recibos deducibles.** El
   spec afirma que "Araguaney y los centros no emiten recibos deducibles". Lo
   primero es cierto; lo segundo no lo sabemos: un centro puede ser donataria
   autorizada en su país. El borrador solo afirma lo que sí es nuestro (la
   plataforma no emite comprobantes fiscales) y remite al centro para lo demás.
   Es la regla del proyecto: los temas fiscales son del centro, no de la
   plataforma.

## Preguntas abiertas

1. **Aceptación por casilla.** Quien dona en línea acepta marcando una casilla;
   en ventanilla, quien captura marca la aceptación presencial de una persona
   moral. Ambas quedan registradas con versión y fecha. ¿Es suficiente como
   manifestación de voluntad para una donación pura, o hace falta algo más en
   alguno de los dos casos?
2. **Quién es parte.** El borrador dice que la donación se hace al centro de
   acopio, no a Araguaney. Algunos centros no tienen personalidad jurídica
   propia (una parroquia, un grupo vecinal). ¿Cómo debe leerse la cláusula en
   ese caso?
3. **Declaraciones de la persona donante** (procedencia lícita, sin vínculo con
   quien recibe). ¿Tienen efecto útil como declaración unilateral, o conviene
   reformularlas?
4. **Exención de la plataforma.** ¿El lenguaje de "proveedor de software, no
   parte" es oponible frente a la persona donante, que no tiene cuenta y nunca
   aceptó los Términos y Condiciones? Por eso los Términos de Donación repiten
   la idea en su introducción.
5. **Versión.** La casilla de `/donar` se acepta hoy como versión 1.0 (solo el
   enunciado de la etiqueta). Al publicar el documento completo, la versión
   sube a 1.1. Las aceptaciones anteriores siguen valiendo contra lo que la
   persona leyó. ¿Algún inconveniente?

## Al publicar, una vez aprobado

1. Ajustar los borradores con las correcciones del abogado y anotar aquí quién
   revisó y en qué fecha.
2. Mover cada borrador fuera de `drafts/` y crear su página, siguiendo el
   patrón de `app/[lang]/terminos/page.tsx`.
3. **Términos de Donación:** subir `CURRENT_DONATION_TERMS_VERSION` en
   `backend/app/legal.py` a la versión del documento y enlazarlo desde la
   casilla de `/donar` y desde la captura en ventanilla.
4. **Exención:** insertar las secciones en `terms.{es,en}.ts` y subir la versión
   de los términos en los cuatro lugares que indica `backend/app/legal.py`. Es
   un cambio sustancial: quien tiene cuenta tendrá que aceptarlos de nuevo.
5. **Política de aceptación:** página propia, enlazada desde `/donar` y desde
   los Términos de Donación.
6. Marcar las tareas 1, 2, 6 y 7 de la Fase 20.
