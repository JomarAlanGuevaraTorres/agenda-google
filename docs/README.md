# Página de voz para GitHub Pages

Esta carpeta contiene la página HTTPS que solicita el micrófono. El texto reconocido se envía a la agenda actual mediante mensajes entre ventanas; Sheets y Calendar siguen gestionados por Apps Script.

## Antes de publicar

1. Aplica `apps-script-bridge.patch` a los archivos de Apps Script locales y vuelve a publicar una nueva versión de la web app.
2. Sube **el contenido de esta carpeta** a un repositorio de GitHub.
3. En el repositorio abre **Settings → Pages**, selecciona **Deploy from a branch**, la rama `main` y la carpeta raíz (`/`).
4. Abre la URL de GitHub Pages. Esa será la URL que usarás para dictar.

No abras `index.html` directamente como archivo local: el permiso del micrófono requiere la URL HTTPS de GitHub Pages.
