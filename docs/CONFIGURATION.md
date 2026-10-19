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
