# 📅 Agenda Inteligente de Clientes — Versión Google (Apps Script)

Agenda conectada a **Google Sheets** (base de datos) + **Google Calendar** (citas), accesible desde tu celular y PC. Interpreta por voz o texto (fecha, hora, teléfono, dirección), con **posponer**, **comentarios** y **gestión "revisar luego"**.

---

## 🧩 Qué necesitas
- Una cuenta de Google (Gmail).
- Un móvil (Android o iPhone) para usarla en la calle.

---

## 👣 PASO 1 — Crear la Hoja de Cálculo (base de datos)
1. Ve a [sheets.new](https://sheets.new) (se abre una hoja nueva) o crea una en drive.google.com.
2. No necesitas escribir nada; el script creará automáticamente la hoja "Agenda".
3. Copia el **ID** que está en la URL:
   `https://docs.google.com/spreadsheets/d/` **`1AbCdEfGhIj...`** `/edit`
   *(todo lo que está entre `/d/` y `/edit` es el ID).*

---

## 👣 PASO 2 — Crear el proyecto de Apps Script
1. Entra en [script.new](https://script.new) (se abre un proyecto nuevo).
2. Bórralo si trae algo y **pega TODO el contenido de `Code.gs`** en el editor.
3. En `Code.gs`, línea ~26, reemplaza:
   ```js
   var SPREADSHEET_ID = 'PEGA-AQUI-EL-ID-DE-TU-HOJA';
   ```
   por tu ID real (entre comillas). Ejemplo:
   ```js
   var SPREADSHEET_ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz';
   ```

---

## 👣 PASO 3 — Crear la interfaz web (Index.html)
1. En el editor de Apps Script, clic en **+** (agregar archivo) → **HTML**.
2. Nombra el archivo exactamente **`Index`** (sin comillas).
3. Borra lo que traiga y **pega TODO el contenido de `Index.html`**.
4. Guarda (Ctrl+S). El proyecto debe tener 2 archivos: `Code.gs` e `Index.html`.

---

## 👣 PASO 4 — Implementar como aplicación web
1. Clic en **Implementar → Nueva implementación**.
2. Tipo: **Aplicación web**.
3. *Ejecutar como:* **Yo** (tu cuenta).
4. *Quién tiene acceso:* **Cualquier persona** (o "Cualquiera con enlace").
5. Clic en **Implementar** → acepta los permisos (elige tu cuenta → "Avanzado" → "Ir a ... (no seguro)" → Permitir).
6. Se genera una **URL de la aplicación web** (algo como `https://script.google.com/macros/s/AKfy.../exec`). **Cópiala.**

---

## 👣 PASO 5 — Usarla en el celular
1. Abre la URL en Chrome (Android) o Safari (iPhone).
2. **Android:** Menú (⋮) → *Agregar a pantalla de inicio*.
   **iPhone:** Botón Compartir → *Agregar a pantalla de inicio*.
3. Se crea un icono como app. Abre la app y pulsa el botón **🎙️** para dictar, o escribe manualmente.

> 💡 El micrófono pide permiso la primera vez; acéptalo.
> 💡 La app queda ligada a tu cuenta de Google: los datos se guardan en tu Sheet y las citas en tu Calendar.

---

## 📖 Cómo se interpreta (IA offline)
- **"visitar a María Pérez el viernes"** → visita · María Pérez · próximo viernes
- **"llamar a Carlos el 15 de septiembre"** → llamada · Carlos · 15 sept
- **"visitar a la señora Ana el lunes a las 4 de la tarde"** → visita · Ana · lunes · 16:00
- **"mantenimiento con Juan en calle 12 tel 999123456"** → visita · Juan · +dir · +tel

Al interpretar te muestra una **vista previa**; pulsa **Guardar** si coincide (se añade al Sheet y crea el evento en Calendar).

---

## 🎛️ Funciones de cada actividad
| Botón | Función |
|-------|---------|
| **✔ Hecho** | Marca como Completado (desaparece de Prioridades) |
| **⏰ Posponer** | Reagenda +1 día / +3 días / +1 semana (actualiza Calendar) |
| **💬 Comentario** | Añade notas en la actividad |
| **🔁 Revisar luego** | Marca gestión "Revisar más adelante" |
| **🗑** | Elimina |

---

## 🔔 Sobre "cuando llegue la hora"
Dos opciones disponibles:
1. **Google Calendar nativo**: como la cita se crea en tu calendario, **configuras recordatorios** ahí (notificación en el móvil). Ve a Calendar → ajustes del evento → recordatorio.
2. **Folio de prioridades**: al abrir la app ves HOY / MAÑANA / VENCIDA en la sección superior con colores.

*(Una versión con disparador por tiempo para enviar avisos automáticos de un evento próximo se puede añadir después si la quieres.)*

---

## ⚠️ Notas
- La primera implementación pide autorización; confía solo si el código es tuyo.
- Para cambios: edita `Code.gs`/`Index.html` y usa **Implementar → Administrar implementaciones → Editar → Nueva versión**.
- Respaldar todo es respaldar tu hoja de Google Sheets (los datos viven ahí).
