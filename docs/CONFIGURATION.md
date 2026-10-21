# Personalización realizada por el proveedor

El cliente no configura MesaOS. El proveedor o su asistente prepara el archivo de cada restaurante y genera un paquete estático terminado. No hay panel de personalización, formulario de onboarding, carga de logos ni catálogo editable desde la interfaz operativa.

## Material que entrega el vendedor al asistente

- Nombre comercial y logotipo del restaurante.
- Menú con categorías, productos, precios y opciones confirmadas.
- Colores principales; si se entrega una referencia, confirmar la paleta antes de finalizar.
- Contacto, dirección y textos de tickets, cuando se necesiten.
- Moneda, zona horaria y URL/id de la instalación.

Si falta un precio o una opción obligatoria, no inventarlos para producir una entrega aparentemente lista.

## Estructura de archivo

La base vacía está en config/restaurant.json. Para cada venta se prepara una copia en clientes/<id>/restaurant.json. preparationAreas asigna a cada categoría cocina, barra o coordinacion; el vendedor confirma ese destino y la comanda lo conserva en su snapshot. El generador rechaza categorías sin área. El menú conserva el esquema del software original: macro-categoría → subcategoría → productos. Un producto requiere id estable, nombre, precio, descripcion y opciones. Los grupos de opciones admiten unica, multiple o texto con requerido y valores/precioExtra. Las estructuras originales siguen cubiertas por sus pruebas existentes.

restaurant incluye id, name, logo, currency, locale, timezone, address, phone, welcome y tagline. theme contiene primary y accent en #RRGGBB. ticket contiene header, footer y menuPdf. logo y menuPdf son rutas locales relativas a la carpeta del archivo de configuración. El generador copia únicamente los recursos declarados, sin arrastrar archivos ajenos del vendedor.

Se validan versión 1, ids únicos, categorías, precios no negativos con hasta dos decimales, opciones requeridas, colores, idioma, zona y rutas. Monedas compatibles: MXN, USD y EUR. Límite de configuración 4 MiB; 50 categorías, 2000 productos, 20 grupos y 50 valores por grupo. Se rechazan rutas externas, recorridos fuera de la carpeta, claves JSON inseguras y estructuras excesivamente profundas.

## Generación

`npm run build -- --config clientes/<id>/restaurant.json`

El archivo config/installation.js de la entrega queda generado y se carga antes de los módulos del POS. No se descarga ni importa configuración desde el navegador del cliente. No se requiere servidor de aplicaciones ni dependencias remotas en ejecución.

La maestra se regenera con `node scripts/build.cjs --sync-template`, conservando el nombre del restaurante vacío y únicamente fichas de ejemplo sin precios (placeholder: true, precio: null). Las categorías y subcategorías se pueden recorrer para revisar la plantilla. El generador de entregas rechaza restaurante sin nombre, logo o productos y también rechaza cualquier ficha marcada como ejemplo: hay que sustituirla o eliminarla antes de entregar. La carpeta de salida debe ser nueva; jamás se utiliza el origen como destino.

## Actualización posterior

Para cambiar el menú o marca de un cliente, se modifica su archivo del vendedor y se vuelve a generar una entrega con el mismo id. Se publican los archivos nuevos en la misma URL. No es necesario darle al cliente herramientas de configuración.

Los pedidos confirmados conservan snapshots de nombres, precios y opciones. El comportamiento original recalcula el borrador al recargar con el catálogo vigente; por eso se deben confirmar o vaciar los borradores y adiciones antes de una actualización de menú. No se deben cambiar moneda o zona horaria de una instalación con ventas sin una migración explícita.

## Pie de ticket opcional

En Opciones > Configuración > Ajustar ticket, el restaurante puede cargar una imagen QR PNG, JPEG o WebP de hasta 1 MiB (100 a 4096 píxeles por lado), añadir un texto opcional y guardar o quitar el QR. Esta personalización no cambia identidad ni menú. Se almacena por restaurante y ruta del sitio en el navegador actual; no se incluye en el expediente de ventas ni se sincroniza entre dispositivos. Si se borran los datos del navegador, hay que volver a cargarla. El nombre mesaOS aparece al final de las cuentas con o sin QR. La imagen debe contener el QR ya generado; la aplicación no cambia su destino ni verifica su contenido. Conviene probar su lectura en una impresión real.

## Descuentos en cuentas

El detalle del pedido permite aplicar un monto fijo o porcentaje (hasta dos decimales, incluido 100%). El descuento se distribuye proporcionalmente entre las partidas con reparto exacto de centavos: cobros por producto, caja, historial y expediente usan los importes netos, conservando precios originales. El ticket muestra subtotal, descuento solo cuando existe y total final. Se puede reemplazar o quitar antes del primer cobro; después queda bloqueado para conservar los pagos registrados. Para añadir o eliminar productos de una cuenta descontada, primero hay que quitar el descuento.

## Menú PDF desde la aplicación

Opciones > Configuración reúne el menú PDF y los ajustes del ticket. El dueño puede seleccionar y guardar un PDF de hasta 10 MiB. El enlace Menú de Opciones abre el PDF guardado; reemplazarlo no modifica el catálogo ni sus precios. Restablecer menú elimina la copia cargada y recupera el PDF original de la instalación, si existe; en otro caso oculta el enlace.

El archivo se conserva como Blob en IndexedDB, separado del expediente de ventas y aislado por restaurante y ruta de instalación. Al borrar los datos del navegador se pierde esta copia. No se incluye en las exportaciones del expediente ni se comparte entre dispositivos; para eso hará falta conectar el almacenamiento en la nube. No se modifica el contenido interno del PDF: se reemplaza por otro archivo.
