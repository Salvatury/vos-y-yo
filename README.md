# El jardín de Jenny

Una web romántica nocturna inspirada en la idea de un jardín que crece con pequeños gestos. Implementación original, sin copiar código ni recursos de Infinite Garden. HTML, CSS y JavaScript modular, sin framework ni compilación.

Web pública: https://salvatury.github.io/el-jardin-de-jenny/

Personalizada para Jenny y Salva con sus recuerdos: primer mensaje el 3/10/2026, primer beso el 13/10/2026 y comienzo del noviazgo el 19/10/2026. Incluye una línea de tiempo, 24 mensajes únicos, recuerdos narrados y carta para el primer mes del 19/11/2026. El chat privado no forma parte del proyecto ni del repositorio.

## Usar y personalizar

Requiere Node.js 20 o posterior solo para la vista previa y las pruebas. En la carpeta del proyecto:

```sh
node scripts/serve.mjs
```

Abrí http://127.0.0.1:4173. Servir por HTTP es necesario para los módulos JavaScript; no abrir `index.html` con doble clic.

- Tocá o enfocá con Tab una flor y presioná Enter para descubrir su mensaje. Cerrá con Escape, con el botón o tocando fuera del cuadro.
- Plantá hasta 16 flores adicionales. Cada una de las 24 flores revela un mensaje diferente.
- Desde el engranaje configurá nombre y fecha. El contador usa días calendario locales; el día inicial es 0. Una fecha futura muestra cuánto falta. Se actualiza cada minuto y al volver a la pestaña.
- Abrí un recuerdo y elegí una foto JPG, PNG o WebP (hasta 15 MB). La imagen se reduce a un máximo de 1000 px y se comprime antes de guardarla. Podés restaurar la ilustración.
- La carta se puede volver a leer siempre. El sonido sintetizado se activa solo al pulsar su botón y se silencia en segundo plano.

Editá `dist/config.js` para cambiar los datos que recibirán todas las personas: nombre, fecha (`AAAA-MM-DD`), hitos de la historia, mensajes, títulos y textos de recuerdos, rutas de fotos, carta y firma. Para fotos públicas, agregá archivos a `dist/assets/` y usá rutas relativas como `assets/nuestro-recuerdo.jpg`. Las fechas principales se confirmaron en la conversación. El paseo y el viaje están ubicados en octubre sin inventar un día exacto. La exportación no incluía fotos: las tres ilustraciones originales representan esos recuerdos y no pretenden ser fotografías reales.

Los ajustes elegidos desde la web se guardan en `localStorage` con la clave `jenny-garden-v1` y prevalecen sobre la configuración del archivo. Son propios de ese navegador y esa dirección: no se sincronizan entre dispositivos y no se transfieren de localhost a Pages. Las fotos cargadas desde la interfaz no se suben al repositorio ni a un servidor. Al borrar los datos del sitio se pierden. Si el navegador bloquea el almacenamiento o no queda espacio, la web avisa y continúa durante la visita. El audio inicia apagado en cada visita.

## Estructura

```text
dist/                  Web lista para publicar
  index.html           Estructura y cuadros de diálogo accesibles
  styles.css           Diseño adaptable, animaciones y movimiento reducido
  app.js               Interacciones y presentación
  config.js            Contenido configurable
  core.js              Fechas, validación y almacenamiento
  art.js               Ilustraciones SVG originales
  assets/favicon.svg
scripts/serve.mjs       Servidor de vista previa sin dependencias
tests/core.test.mjs     Pruebas unitarias con Node
tests/browser.mjs       Pruebas de integración en Chrome
tests/run-browser.mjs   Ejecuta servidor y pruebas juntos
.github/workflows/     Publicación automática en GitHub Pages
```

Las tipografías se cargan desde Google Fonts; sin conexión se usan fuentes del sistema. El resto de la experiencia no depende de servicios externos. No hay analítica, claves, backend ni formularios que envíen datos.

## Pruebas

```sh
node --test tests/core.test.mjs
```

Para repetir las pruebas completas del navegador, instalá Playwright (`npm install --no-save playwright`) y tené Google Chrome instalado. Luego:

```sh
node tests/run-browser.mjs
```

Se generan capturas de escritorio y móvil y un informe en `artifacts/`. Cubren los ocho mensajes, teclado y Escape, plantación y su límite, configuración, contador, carta, fotos, audio, persistencia tras recarga, almacenamiento bloqueado y anchos de 320, 375, 390 y 768 px. La captura de escritorio usa 1440 px. El navegador debe permitir conexiones locales. En el entorno de desarrollo se utilizó la biblioteca Playwright incluida en el runtime.

## GitHub Pages

El workflow ejecuta las pruebas unitarias y publica únicamente `dist/` al subir cambios a `main`. En el repositorio, `Settings > Pages > Build and deployment > Source` debe estar en **GitHub Actions**. El flujo también se puede ejecutar desde `Actions > Publicar el jardín en GitHub Pages > Run workflow`.

Para una publicación manual desde cero: creá un repositorio, subí el proyecto completo a `main`, elegí GitHub Actions como origen de Pages y ejecutá el workflow. La URL definitiva aparece en la ejecución y en Settings > Pages. Todos los enlaces y recursos de la web son relativos y funcionan bajo un subdirectorio de Pages.

El contenido de `dist/` publicado será accesible en Internet. La sorpresa de la carta es visual, no una protección de acceso. No publiques fotos o textos privados en `config.js` si no querés hacerlos públicos.
