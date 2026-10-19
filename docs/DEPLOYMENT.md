# Entrega por restaurante en GitHub Pages

## Flujo del vendedor

1. Proporcionar al asistente menú, logo y paleta del restaurante.
2. Preparar y validar su archivo de configuración independiente.
3. Ejecutar `npm run build -- --config clientes/<id>/restaurant.json`.
4. Revisar el paquete generado en dist. No incluye menú, PDF, logo ni catálogo JavaScript de Amor & Amor, tests, herramientas, respaldos o ventas.
5. Publicar el contenido de esa carpeta en la raíz del repositorio del restaurante.
6. Configurar GitHub Pages con la rama y carpeta raíz. Abrir la URL HTTPS y verificar identidad, menú, precio de opciones, una venta ficticia, caja y tickets antes de habilitar operación real.

El generador incorpora .nojekyll y un manifiesto con nombre, logo y color del restaurante. start_url y scope son `./`. No hay build en GitHub ni rutas absolutas dependientes del nombre del repositorio. El cliente abre el enlace y trabaja con la instalación ya preparada.

La publicación remota no se realiza automáticamente desde esta tarea. El paquete local es el entregable revisable para que el vendedor lo publique en la cuenta autorizada.

## Instalación nueva y actualización

Una nueva instalación usa id exclusivo y URL independiente y empieza sin datos. La maestra está vacía deliberadamente y sus controles operativos permanecen inactivos. No debe entregarse como restaurante listo: el generador exige nombre, logo y al menos un producto.

En una actualización conserva id y URL. Confirma/vacía selecciones pendientes y cierra el turno fuera del horario de servicio. Conserva copia de archivos y datos antes de reemplazar el sitio. Cambiar URL, origen o navegador no transporta ventas; tampoco existe fusión o sincronización de múltiples terminales.

## Compatibilidad

Sin dependencias de ejecución externas. JavaScript clásico, localStorage, Intl, dialog y window.print. Los módulos de negocio y la interfaz proceden del sistema original. El manifiesto proporciona metadatos de acceso directo; no hay service worker ni garantía de operación offline como PWA.

Los datos son locales al navegador. Un dispositivo operativo por restaurante es el alcance inicial. La impresión abre el diálogo del navegador y utiliza papel de 80 mm. Asignación de impresoras, impresión silenciosa y confirmación de papel requieren integración adicional.

Los sitios del mismo usuario de GitHub Pages pueden compartir origen: las claves por subruta/id evitan mezclas accidentales pero no constituyen aislamiento de seguridad. Usar un origen independiente cuando se requiera aislamiento entre clientes.
