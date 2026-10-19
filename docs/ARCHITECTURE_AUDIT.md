# Auditoría y diseño de la plantilla del vendedor

La base actual es el POS original estático con 11 módulos JavaScript, tres hojas CSS, manifiesto y 105 productos. El usuario aportó ocho suites de pruebas y 32 capturas originales. Antes de esta corrección se creó backups/before-vendor-template-20261017.tar.gz, en la rama codex/mesaos-template. No se modificaron las carpetas externas del usuario.

La interfaz coordina catálogo, modificadores, borrador, mesas/delivery, pedidos, adiciones/cancelaciones, preparación, cobros parciales por partida, pagos mixtos, caja, gastos, propinas, reparto, reportes e impresión. Cash y Orders conservan reglas puras y cálculos en centavos. Storage valida pedidos, movimientos, sumas y vínculos. No hay backend, autenticación real, sincronización ni conexión bancaria.

## Ajuste de producto solicitado

MesaOS es una base vacía propiedad del vendedor. El asistente adapta por restaurante un único archivo y recursos locales; un generador produce la instalación lista para GitHub Pages. El usuario final recibe sólo el POS operativo. No se implementa un editor de marca/catálogo, ni se entrega un restaurante ficticio de demostración.

El árbol fuente conserva material original exclusivamente para pruebas y recuperación. El generador selecciona una lista de recursos y excluye el material de marca y menú de Amor & Amor. La página maestra carga un menú vacío, no js/menuData.js. Las funciones internas mantienen los nombres globales originales para reducir el riesgo de romper contratos y conservar las pruebas.

Se desacoplaron identidad visible, colores, logo, moneda, zona, datos del ticket y categorías del catálogo. Las instalaciones usan una clave por subruta e id; el formato de expediente operativo v2 y sus validaciones se conservan. Las claves reales originales no se importan automáticamente.

## Riesgos y límites vigentes

Persistencia local sin copia remota; posibilidad de pérdida al borrar datos o perder el equipo. Revisión optimista de almacenamiento sin exclusión mutua completa entre pestañas. No operar dos pestañas/terminales a la vez. Ausencia de autenticación de servidor: esconder un editor no protege archivos públicos. Borradores recalculados con catálogo vigente al recargar: actualizar sólo sin selecciones pendientes. No hay impuestos añadidos ni facturación fiscal. Es necesario acreditar derechos del código y material antes de distribuir comercialmente y validar dispositivos/impresoras reales.

Las operaciones monetarias no fueron rediseñadas para esta corrección. La evidencia de compatibilidad se registra en TESTING.md con las suites originales.
