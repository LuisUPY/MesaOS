# Evolución comercial de MesaOS

El producto inicial es una plantilla del vendedor y una instalación estática independiente por restaurante. Las próximas adaptaciones se preparan con el asistente y se publican en GitHub Pages; no se requiere un constructor para usuarios finales.

Antes de comercializar como operación crítica: aceptación presencial de caja e impresora, respaldos externos y restauración verificada, pruebas en dispositivos reales y acreditación de derechos del código/recursos. Ampliar la recuperación de datos desde la interfaz operativa puede ser útil; es independiente de personalizar el software.

Siguiente etapa local: bloqueo de pestañas, respaldos operativos completos, snapshots de borrador y migración transaccional a IndexedDB para volumen mayor. Mantener las pruebas originales como regresión y los flujos de caja en centavos.

Etapa con backend (no implementada): autenticación real, autorización, base remota, respaldos, sincronización/idempotencia entre terminales, actualizaciones centralizadas y administración del vendedor. Licencias, suscripciones y Whop se evaluarían con secretos/webhooks de servidor, no simulaciones en JavaScript público.
