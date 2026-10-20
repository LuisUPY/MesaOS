# Publicación en GitHub Pages

## Publicar el proyecto actual

La aplicación funciona sin backend ni dependencias externas de ejecución. La versión actual es una demo operativa: la configuración maestra se mantiene vacía y `js/demo.js` genera sus 46 productos ficticios antes de inicializar el catálogo.

Desde la carpeta del proyecto, con Node.js 22 o posterior:

```sh
npm ci
npm run check
npm test
npm run build
npm run preview
```

Revisa **http://127.0.0.1:4188/**. El resultado está en `dist/pages/`. El generador comprueba las referencias del HTML, CSS, manifiesto y recursos dinámicos. Distingue mayúsculas y minúsculas para detectar rutas que macOS podría aceptar y Pages rechazar. Incorpora `.nojekyll` y versiones de contenido en las referencias del HTML y CSS para actualizar la caché cuando cambian los archivos.

El paquete excluye tests, node_modules, herramientas, respaldos, capturas, archivos del sistema y el catálogo original de Amor & Amor. La carpeta generada se reemplaza al volver a construir. Si `dist/pages/` contiene una carpeta creada fuera del generador, éste se detiene para evitar sobrescribirla.

## Publicación automática con GitHub Actions

1. Sube el proyecto a la rama `main`, incluyendo todos los archivos nuevos de `js/`, `assets/platform/`, `scripts/`, `tests/` y `.github/workflows/pages.yml`.
2. En **Settings → Pages → Build and deployment**, selecciona **GitHub Actions** como origen.
3. En **Actions**, abre **Validar y publicar MesaOS** y pulsa **Run workflow**, o sube un nuevo cambio a `main`.
4. El flujo instala las dependencias y Chromium, valida sintaxis/configuración, ejecuta las 25 pruebas de lógica, genera el sitio y ejecuta las pruebas del paquete y las dos suites de navegador existentes. Publica sólo si todas pasan.
5. Abre la dirección que devuelve el trabajo `deploy`. Con el remoto actual, se espera **https://luisupy.github.io/mesaOS/**.

Las solicitudes de cambios hacia `main` ejecutan validación y pruebas sin desplegar. Sólo el trabajo de despliegue tiene permisos de Pages y OIDC. El repositorio debe tener Pages disponible en su plan y permitir GitHub Actions. Configuración basada en la [documentación oficial de flujos de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

No necesitas una ruta base fija: todos los recursos usan referencias relativas. El mismo paquete funciona en `/`, `/mesaOS/` o con otro nombre de repositorio. `start_url` y `scope` son `./`. La navegación ocurre dentro de una sola página; no requiere reglas de reescritura ni redirecciones 404.

## Alternativa manual

Publica **el contenido** de `dist/pages/` en la raíz de una rama dedicada, conserva `.nojekyll` y selecciona **Deploy from a branch**, esa rama y **/(root)** en Pages. No subas la carpeta como `dist/pages/` dentro de la rama de publicación ni selecciones `/docs` como origen.

## Entrega por restaurante

1. Prepara menú, logo, paleta y, opcionalmente, PDF en una carpeta independiente, siguiendo `CONFIGURATION.md`.
2. Ejecuta `npm run build -- --config clientes/<id>/restaurant.json`.
3. Publica el contenido de la carpeta que imprime el comando mediante la alternativa manual. El generador exige nombre, logo y productos completos; una instalación lista no activa la demo.
4. Para automatizar una entrega en su repositorio, adapta el paso de construcción del flujo para usar `--config` y `--out dist/pages`. Las comprobaciones específicas de la maestra/demo deben mantenerse en el repositorio de la plantilla; valida el menú real de la entrega en su propio flujo.

El generador conserva la validación del restaurante y añade las mismas comprobaciones de rutas y versiones de caché. Cada entrega incluye un manifiesto con el nombre, logo y color del restaurante. La preparación local no sube cambios ni publica por sí sola.

## Instalación nueva y actualización

Una nueva instalación usa id exclusivo y URL independiente y empieza sin datos. La configuración maestra se conserva vacía; al abrirla, la página activa una demo operativa con menú y datos ficticios bajo el identificador separado `mesaos-demo`. Las instalaciones configuradas no activan la demo. No debe entregarse como restaurante listo: el generador exige nombre, logo y al menos un producto.

En una actualización conserva id y URL. Confirma/vacía selecciones pendientes y cierra el turno fuera del horario de servicio. Conserva copia de archivos y datos antes de reemplazar el sitio. Cambiar URL, origen o navegador no transporta ventas; tampoco existe fusión o sincronización de múltiples terminales. Las claves locales incluyen subruta e id, y no cambian con las versiones de caché. Los datos del servidor local no se transfieren automáticamente a GitHub Pages.

## Compatibilidad

Sin dependencias de ejecución externas. JavaScript clásico, localStorage, Intl, dialog y window.print. Los módulos de negocio y la interfaz proceden del sistema original. El manifiesto proporciona metadatos de acceso directo; no hay service worker ni garantía de operación offline como PWA.

Los datos son locales al navegador. Un dispositivo operativo por restaurante es el alcance inicial. La impresión abre el diálogo del navegador y utiliza papel de 80 mm. Asignación de impresoras, impresión silenciosa y confirmación de papel requieren integración adicional.

Los sitios del mismo usuario de GitHub Pages pueden compartir origen: las claves por subruta/id evitan mezclas accidentales pero no constituyen aislamiento de seguridad. Usar un origen independiente cuando se requiera aislamiento entre clientes.
