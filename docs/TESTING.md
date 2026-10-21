# Verificación de la plantilla del vendedor

## Preparación para GitHub Pages (20 de octubre de 2026)

El modo ligero se comprueba desde **Opciones → Desactivar animaciones**: se detienen animaciones CSS y dibujos del canvas, se omiten los vuelos de productos y la preferencia persiste al recargar. Se crea un pedido con los efectos desactivados y se vuelven a activar desde el mismo botón. Una sesión independiente verifica el movimiento reducido del sistema y que la elección manual permita reactivar las animaciones.

`npm run build` genera la demo actual en `dist/pages/`. `npm run test:pages` construye y sirve ese paquete real en `/` y `/mesaOS/`, además de una entrega configurada en `/cliente/`. No sustituye el catálogo mediante scripts de arranque del navegador. Recorre todas las categorías y subcategorías a 1440, 820, 390 y 320 px, compara los productos visibles, verifica que puedan añadirse, prueba búsqueda sin acentos, opciones obligatorias, creación de pedido, impresión simulada y persistencia tras recargar. También comprueba imágenes, carga de estilos, ausencia de desbordamiento, errores JavaScript/HTTP y recursos solicitados fuera de la subruta. En la demo verifica 46 productos; en la entrega comprueba identidad, logo y disponibilidad del PDF.

La suite comprueba además construcción repetible, exclusión de archivos internos, rechazo de sobrescrituras de entregas y detección de rutas con mayúsculas incorrectas. Las nuevas capturas se guardan en `test-results/pages/`. La prueba del PDF verifica su ruta HTTP, no su representación en un lector.

Resultado local: `npm run check`, las 25 pruebas de `npm test`, `npm run test:pages` y las dos suites de `npm run test:browser` aprobadas en Chrome. Las capturas de compatibilidad de esta revisión se guardaron en una carpeta temporal para conservar las existentes. Las suites admiten `MESAOS_TEST_OUTPUT` para cambiar su destino y `PLAYWRIGHT_CHANNEL=chromium` para utilizar Chromium instalado por Playwright. GitHub Actions utiliza esa segunda opción; la primera ejecución remota sólo podrá verificarse después de subir los cambios y habilitar Pages.

La impresión se simula para comprobar los tickets sin abrir diálogos físicos. La comprobación local no certifica Safari/iOS, Android físico ni operación sin conexión.

Las ocho suites originales en tests se conservan byte a byte. tests/original-provenance.json registra sus SHA-256. Las capturas que proporcionó el usuario no se sobrescriben; las ejecuciones adaptadas guardan resultados en test-results/vendor-compat.

`npm test`: **25 pruebas aprobadas** en las seis suites originales de lógica. Se verifican 105 productos, 109 extras individuales, opciones obligatorias, cálculos, pagos parciales/mixtos, cambio, caja, gastos, propinas/reparto, cortes, cancelaciones, integridad, errores de cuota y contratos de impresión.

`npm run test:browser`: ejecuta copias de las dos suites originales. Se adaptan rutas, destino de capturas, canal Chrome y carga de un fixture del restaurante original antes del catálogo. La copia de compatibilidad también espera el gris neutro de las mesas ocupadas en lugar del anterior gris azulado. Las aserciones operativas y monetarias permanecen. Las pruebas originales no se reemplazan por suites escritas desde cero.

`npm run check`: valida que la maestra sólo contenga fichas de ejemplo sin precios, el JavaScript generado coincida con su configuración, los archivos existan, la sintaxis sea correcta y las suites originales conserven sus huellas. El generador también debe rechazar una entrega sin nombre, logo o productos y un destino ya existente.

La verificación en navegador de la maestra y un paquete configurado comprueba el catálogo navegable de fichas de ejemplo, venta inactiva sin asistente de configuración, identidad ya instalada en la entrega, navegación por categorías, rutas bajo subdirectorio y ausencia de un editor del cliente. Ambas suites originales de navegador fueron aprobadas a 1440, 820, 390 y 320 px. La comprobación de la maestra vacía y una entrega bajo /cliente/ también fue aprobada sin errores JavaScript. Se verificó que el generador excluya el material original y rechace sobrescrituras.

No se probaron desde esta tarea impresoras físicas ni Safari/iOS o Android físico. Los anchos de 1440, 820, 390 y 320 de la suite original cubren diseño en Chrome, no certificación de dispositivos. No se declara la plantilla un servicio sincronizado o protegido por login.

## Ajuste visual de fichas de plantilla

Verificado en Chrome a 787×627 y 390×844: se eliminó el texto duplicado junto al logo; se conservan cinco categorías y 22 subcategorías originales, con 44 fichas «Producto 1»/«Producto 2» sin precio. La navegación y la búsqueda están habilitadas; el pedido y la caja permanecen inactivos. No hubo errores JavaScript ni escrituras de almacenamiento al recorrer las subcategorías. El generador rechaza estas fichas al preparar una entrega comercial. Los archivos de pruebas originales permanecen intactos.

## Demo interactiva (19 de octubre de 2026)

La página maestra ahora activa automáticamente una demo con productos, dos pedidos abiertos, ventas, un corte anterior y un turno abierto con gastos y propinas. La configuración fuente sigue vacía para generar entregas; la demo usa un identificador de almacenamiento independiente. Los accesos directos permiten recorrer pedidos/cocina/barra, cobros, caja, gastos, propinas, ventas, cortes y expedientes. Restablecer demo requiere confirmación y borra únicamente su expediente.

Verificación en Chrome: todos los accesos directos abren su función, creación de pedido, persistencia tras recargar y restauración de ejemplos; sin errores JavaScript ni desbordamiento a 1440, 390 y 320 px. Las 25 pruebas de lógica y `npm run check` pasan.

## Limpieza visual (20 de octubre de 2026)

El encabezado del catálogo muestra sólo «Menú». La paleta base, estados e iconos usan blancos, negros y grises. Las partículas del aviso conservan su movimiento y reacción al cursor con un degradado neutro. Las ondas SVG decorativas quedan detrás del contenido, con opacidad baja y movimiento lento; respetan movimiento reducido y se ocultan al imprimir. Los accesos directos de la franja demo y su diálogo de restablecimiento se retiraron por petición del usuario; las funciones operativas siguen en sus controles habituales.

La copia de compatibilidad de caja sólo cambia la expectativa del color de fondo de la mesa ocupada a `rgb(231, 231, 231)`. Las suites originales y sus huellas permanecen intactas.

### Mayor visibilidad y distribución de las ondas

Las ondas usan ahora un SVG local repetible en toda la altura del espacio de trabajo y como fondo del panel de pedido, la franja de pedidos abiertos y el pie. El contraste es mayor y el desplazamiento continuo completa un ciclo sin salto cada 38 segundos. Se comprobó visualmente la cabecera y una sección inferior del catálogo; los controles permanecen operativos y las tarjetas conservan su fondo sólido. Se mantienen las reglas de movimiento reducido y de impresión. `npm run check` aprobado.

### Ondas pastel y subcategorías translúcidas

Por petición posterior, las ondas del fondo incorporan degradados pastel azul, lavanda, rosa, ámbar y menta; los controles y textos mantienen su paleta neutra. El patrón aumenta de 1200×680 a 1680×952 y las bandas son más anchas y opacas. Las subcategorías usan fondos translúcidos con desenfoque ligero, borde neutro y estado seleccionado diferenciado. Verificación visual y selección de Pastas correctas; `npm run check` aprobado.

### Fondo principal de bandas conectadas

El multicolor se limita al fondo principal del espacio de trabajo. El panel de pedido, pedidos abiertos y pie usan un SVG neutro independiente. La onda principal combina bandas superpuestas de 150–222 unidades de grosor sobre un patrón de 2000×1250 px, con un único degradado en coordenadas comunes y extremos de igual color para evitar cortes al repetirlo. Su ciclo continuo dura 68 segundos. Se mantienen los botones translúcidos, movimiento reducido y exclusión de fondos al imprimir. Referencia visual revisada: https://mesa-os.whop.site/. SVG válidos y revisión visual realizada.

## Efectos al confirmar pedidos

Crear y confirmar tienen un destello de degradado al activar sus botones. Después de un guardado exitoso, hasta cinco representaciones decorativas de las partidas vuelan a la tarjeta correspondiente; con la cola oculta, llegan al encabezado de pedidos abiertos sin expandirla ni desplazar la página. La impresión se solicita al terminar el traslado (con un límite de un segundo), o inmediatamente si se prefiere movimiento reducido. La animación no modifica los registros y sus representaciones se eliminan al terminar. Un fallo visual no impide solicitar la impresión de lo ya guardado.

Los bordes degradados se derivan del número estable del pedido, con variación de matiz y orientación; conservan su aspecto al recargar sin almacenar información adicional. El número y la etiqueta siguen identificando el pedido además del color.

Verificación: 25 pruebas de lógica, ambas suites existentes de navegador y `npm run check` aprobados. La copia de compatibilidad de la suite original añade comprobaciones del traslado y su limpieza, cola oculta, color estable al recargar, degradados diferentes, movimiento reducido y ausencia de traslado cuando falla la escritura. Los originales permanecen intactos.

## Regresión de la vista previa del pedido

`tests/order-preview-browser.test.cjs` usa el paquete real de GitHub Pages bajo `/mesaOS/`. Reproduce la lista de productos colapsada a 0 px a 1440 × 800 con la barra de pedidos abierta, aunque existen partidas y total. Verifica alto mínimo visible, acciones dentro del panel, barra abierta/cerrada, recarga del borrador, ventanas cortas y altas, móvil y desplazamiento de cuentas largas. Se ejecuta en `npm run test:browser`; `npm run test:preview:webkit` permite comprobar también WebKit. Para una instalación distinta de WebKit se puede indicar `MESAOS_WEBKIT_EXECUTABLE`.

## Observaciones de preparación

`tests/notes.test.cjs` cubre la identidad de selecciones con notas distintas, unión de cantidades al quitar una nota, límites y conservación de opciones/precios. `tests/notes-browser.test.cjs` comprueba el botón de escritura, edición/cancelación/eliminación, persistencia de notas en productos y extras, disposición móvil y que Cocina y Barra impriman las observaciones únicamente con sus productos. Ambas pruebas forman parte de los comandos habituales de pruebas.
