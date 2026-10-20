# MesaOS

Punto de venta estático, preparado para GitHub Pages. La versión actual abre la demo interactiva con productos y pedidos de ejemplo. El vendedor también puede generar instalaciones independientes con el menú, los colores y el logo de cada restaurante.

## Levantar el servidor local

Abre una terminal y ejecuta:

```sh
# Desde la carpeta del proyecto:
python3 -m http.server 4187 --bind 127.0.0.1
```

Después abre **http://127.0.0.1:4187/** en tu navegador. Mantén la terminal abierta mientras uses la vista previa. Para detener el servidor, presiona **Ctrl+C**.

Si tienes npm instalado, también puedes ejecutar `npm start` desde la carpeta del proyecto: utiliza el mismo servidor y puerto. No necesitas instalar paquetes para ejecutar el comando de Python.

Si el puerto está ocupado, detén la instancia anterior o usa otro puerto:

```sh
python3 -m http.server 4188 --bind 127.0.0.1
```

En ese caso abre **http://127.0.0.1:4188/**.

La aplicación sigue siendo HTML, CSS y JavaScript estático. Usa el servidor para comprobar las mismas condiciones de carga que tendrá la publicación.

## Publicar la versión actual en GitHub Pages

El proyecto requiere Node.js 22 o posterior para construir y ejecutar las pruebas. Python 3 se utiliza únicamente para la vista previa local.

```sh
npm ci
npm run build
npm run preview
```

Abre **http://127.0.0.1:4188/**. El paquete listo para publicar está en **dist/pages/** e incluye la demo actual, estilos, imágenes y catálogo. Esa carpeta se regenera en cada construcción; no la edites a mano.

1. Sube el proyecto completo a la rama `main` de GitHub, incluyendo los archivos nuevos y `.github/workflows/pages.yml`.
2. En el repositorio, abre **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. En **Actions**, ejecuta **Validar y publicar MesaOS** o sube un cambio a `main`.

El flujo comprueba el proyecto, recorre los productos en navegador a cuatro tamaños y publica sólo `dist/pages/`. En solicitudes de cambios ejecuta las mismas comprobaciones sin publicar. Para el remoto actual, la dirección prevista es **https://luisupy.github.io/mesaOS/**; GitHub mostrará la dirección definitiva al terminar. La preparación local no publica ni sube cambios por sí sola.

También puedes publicar manualmente el contenido de `dist/pages/` en la raíz de una rama de publicación y seleccionar esa rama en Pages. No selecciones `/docs`: esa carpeta contiene documentación, no la aplicación.

## Preparar una entrega

El vendedor prepara la configuración y los recursos del restaurante en una carpeta independiente y genera el paquete con:

```sh
npm run build -- --config clientes/mi-restaurante/restaurant.json
```

Publica el contenido de la carpeta generada en GitHub Pages. El restaurante utiliza la interfaz terminada, sin herramientas de personalización.

## Verificación

```sh
npm run check
npm test
npm run test:pages
npm run test:browser
```

Las pruebas de navegador usan Chrome instalado. Para usar Chromium de Playwright, ejecuta `npx playwright install chromium` y antepone `PLAYWRIGHT_CHANNEL=chromium` a los comandos de navegador. Las pruebas de Pages sirven el paquete en `/`, `/mesaOS/` y `/cliente/`, sin sustituir su catálogo, y comprueban rutas, productos, búsqueda, opciones, pedidos y persistencia a 1440, 820, 390 y 320 px.

## Documentación

- [Configuración del restaurante](docs/CONFIGURATION.md)
- [Publicación en GitHub Pages](docs/DEPLOYMENT.md)
- [Pruebas existentes](docs/TESTING.md)

Los datos operativos se guardan en el navegador y origen utilizados; no se sincronizan entre equipos.
