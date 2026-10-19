# Verificación de la plantilla del vendedor

Las ocho suites originales en tests se conservan byte a byte. tests/original-provenance.json registra sus SHA-256. Las capturas que proporcionó el usuario no se sobrescriben; las ejecuciones adaptadas guardan resultados en test-results/vendor-compat.

`npm test`: **25 pruebas aprobadas** en las seis suites originales de lógica. Se verifican 105 productos, 109 extras individuales, opciones obligatorias, cálculos, pagos parciales/mixtos, cambio, caja, gastos, propinas/reparto, cortes, cancelaciones, integridad, errores de cuota y contratos de impresión.

`npm run test:browser`: ejecuta copias de las dos suites originales. Sólo se adaptan rutas, destino de capturas, canal Chrome y carga de un fixture del restaurante original antes del catálogo. Las aserciones operativas y monetarias permanecen. Las pruebas originales no se reemplazan por suites escritas desde cero.

`npm run check`: valida que la maestra sólo contenga fichas de ejemplo sin precios, el JavaScript generado coincida con su configuración, los archivos existan, la sintaxis sea correcta y las suites originales conserven sus huellas. El generador también debe rechazar una entrega sin nombre, logo o productos y un destino ya existente.

La verificación en navegador de la maestra y un paquete configurado comprueba el catálogo navegable de fichas de ejemplo, venta inactiva sin asistente de configuración, identidad ya instalada en la entrega, navegación por categorías, rutas bajo subdirectorio y ausencia de un editor del cliente. Ambas suites originales de navegador fueron aprobadas a 1440, 820, 390 y 320 px. La comprobación de la maestra vacía y una entrega bajo /cliente/ también fue aprobada sin errores JavaScript. Se verificó que el generador excluya el material original y rechace sobrescrituras.

No se probaron desde esta tarea impresoras físicas ni Safari/iOS o Android físico. Los anchos de 1440, 820, 390 y 320 de la suite original cubren diseño en Chrome, no certificación de dispositivos. No se declara la plantilla un servicio sincronizado o protegido por login.

## Ajuste visual de fichas de plantilla

Verificado en Chrome a 787×627 y 390×844: se eliminó el texto duplicado junto al logo; se conservan cinco categorías y 22 subcategorías originales, con 44 fichas «Producto 1»/«Producto 2» sin precio. La navegación y la búsqueda están habilitadas; el pedido y la caja permanecen inactivos. No hubo errores JavaScript ni escrituras de almacenamiento al recorrer las subcategorías. El generador rechaza estas fichas al preparar una entrega comercial. Los archivos de pruebas originales permanecen intactos.
