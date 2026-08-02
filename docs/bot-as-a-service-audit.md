# Auditoría arquitectónica: Ruby Hoshino como Bot-as-a-Service

## Objetivo

Convertir la identidad actual de Ruby Hoshino, hoy acoplada a textos, assets locales y variables globales, en un perfil persistente por sesión para que el bot principal y cada sub-bot puedan personalizar nombre, prefijo, media de menú, media de bienvenida/despedida y opciones funcionales sin modificar comandos manualmente.

## Pilar 1: mapeo de código estático a dinámico

### Hallazgos estructurales

| Área | Estado actual | Riesgo para personalización |
| --- | --- | --- |
| `menuall` | Renderiza un template grande dentro del comando y elige aleatoriamente un `.mp4` local desde `src/menu`. | El nombre Ruby Hoshino, el prefijo `#` y los videos del menú están acoplados al template y al filesystem local. |
| Menús individuales/listados | Usan `usedPrefix` para IDs o ayuda, pero muchos textos todavía dicen Ruby o usan ejemplos de Ruby. | El prefijo dinámico sería parcialmente compatible, pero la identidad visual/nombre seguiría estática. |
| Bienvenida/despedida | El listener `_welcome` usa imágenes locales fijas `welcome_card.jpg` y `leave_card.jpg`, textos default embebidos y comandos `#setwelcome`/`#setbye` literales. | El media y los textos default no pueden variar por sub-bot; solo el texto por grupo es personalizable. |
| Prefijo | `global.prefix` se inicializa como regex global y el resolver prioriza `plugin.customPrefix`, luego `conn.prefix`, luego `global.prefix`. | Ya existe un punto de inyección por socket (`conn.prefix`), pero no se hidrata desde un perfil persistente por sesión. |
| Sesión/sub-bot | `attachSessionState` crea `conn.session` con `id`, `type`, `parentId` y `path`. `subbot-store` ya mantiene metadata por sub-bot. | Falta una tabla especializada para identidad de bot y falta cargarla en el socket al arrancar/reconectar. |

### Fuentes de hardcode relevantes

- Identidad global: `settings.js` define `global.nameqr`, `global.Rubysessions` y enlaces globales con nombres Ruby/Hoshino.
- Assets del menú completo: `main-menu.js` escanea `src/menu` y selecciona un video local aleatorio.
- Nombre en menú completo: el saludo de `menuall` contiene `Ruby Hoshino` en el template.
- Prefijo global: `bootstrap/app.js` asigna `global.prefix = new RegExp('^[#/!.]')`.
- Resolver de prefijo: `getPrefixMatch` ya acepta `conn.prefix`, útil para convertir el prefijo en configuración por sesión.
- Bienvenida/despedida: `_welcome.js` usa imágenes locales y templates embebidos.
- `tourl`: `convertidor-tourl.js` ya tiene el flujo base de descargar media, subirla y responder con URL.

### Estrategia de refactorización propuesta

1. **Crear un módulo de perfil de bot** (`src/core/bot-profile.js` o `src/library/bot-profile-store.js`) con tres responsabilidades:
   - `ensureBotProfileSchema(sqlite)` para crear/migrar la tabla.
   - `getBotProfile(sessionId)` / `upsertBotProfile(sessionId, patch)` para persistencia.
   - `buildEffectiveBotProfile(conn)` para fusionar defaults + tabla + datos del socket.

2. **Hidratar el socket al crear/adjuntar sesión**:

```js
const profile = await loadBotProfileForSession(conn.session.id)
conn.botProfile = profile
conn.prefix = profile.customPrefix
```

3. **Pasar el perfil a comandos y hooks**:
   - Añadir `botProfile: conn.botProfile || getDefaultBotProfile()` a `buildExecutionContext`.
   - En listeners `before`, leer `conn.botProfile` directamente porque no pasan por el mismo contexto de comandos.

4. **Mantener compatibilidad visual con helpers**:

```js
function getBotDisplayName(conn) {
  return conn?.botProfile?.botName || global.botname || 'Ruby Hoshino'
}

function getBotPrefix(conn, usedPrefix) {
  return usedPrefix || conn?.botProfile?.customPrefix || '#'
}
```

5. **Refactor incremental de templates**:
   - Fase 1: reemplazar literales de identidad en `menuall` y `_welcome` por `botProfile.botName` y helpers visuales.
   - Fase 2: mover cada menú a renderers puros (`renderMenuAll({ profile, user, stats, usedPrefix })`).
   - Fase 3: extraer todos los textos/frames a una capa de diseño para no mezclar lógica, DB y estética.

## Pilar 2: esquema de base de datos SQLite

### Tabla recomendada

```sql
CREATE TABLE IF NOT EXISTS bot_profiles (
  session_id TEXT PRIMARY KEY,
  bot_jid TEXT,
  owner_jid TEXT,
  bot_name TEXT NOT NULL DEFAULT 'Ruby Hoshino',
  custom_prefix TEXT NOT NULL DEFAULT '#',
  menu_video_url TEXT,
  menu_image_url TEXT,
  welcome_image_url TEXT,
  goodbye_image_url TEXT,
  welcome_enabled INTEGER NOT NULL DEFAULT 1,
  goodbye_enabled INTEGER NOT NULL DEFAULT 1,
  meta_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_bot_profiles_bot_jid ON bot_profiles(bot_jid);
CREATE INDEX IF NOT EXISTS idx_bot_profiles_owner_jid ON bot_profiles(owner_jid);
```

### Reglas de datos

- `session_id` debe ser la clave primaria porque sobrevive a reconexiones y es el identificador natural ya usado por el gestor de sesiones.
- `bot_jid` es opcional al crear un sub-bot pendiente, pero debe actualizarse cuando Baileys confirme el número.
- `owner_jid` permite validar permisos sin depender de metadatos externos.
- `custom_prefix` debe guardarse como texto simple, no regex. La regex se compila al hidratar `conn.prefix`.
- URLs deben validarse como `https://` y con MIME esperado antes de persistirse.
- `meta_json` reserva extensibilidad para temas visuales, colores, variantes de menú o CDN provider sin alterar schema.

### Relación con tablas existentes

- No se debe mezclar este perfil en `chats.value`, porque esos datos son por grupo y la identidad del sub-bot es por sesión.
- Puede complementarse con `subbots.owner_jid`/`subbots.session_id`, pero conviene tabla separada para evitar acoplar control operativo del sub-bot con identidad/branding.

## Pilar 3: estrategia de ingestión media (CDN)

### Modularización propuesta

Crear o ampliar `src/library/uploader.js` con una función de alto nivel:

```js
export async function uploadAuto(buffer, mime, options = {}) {
  // Valida tamaño/MIME, intenta proveedores por orden y devuelve { url, provider, mime, size }
}
```

La función debe encapsular la estrategia multi-CDN (`adofiles`, `fare`, `uguu` y fallback existente como `qu.ax`/`file.io`) para que los futuros comandos no conozcan detalles de proveedores.

### Flujo de comandos futuros

1. Usuario responde a una imagen/video con `#setbotmenu`, `#setbotwelcome` o `#setbotbye`.
2. El comando valida permiso con middleware de dueño de sub-bot/owner global.
3. Descarga el buffer desde Baileys (`q.download()`).
4. Valida MIME y tamaño según campo:
   - `menu_video_url`: `video/mp4`, límite recomendado 8-15 MB.
   - `menu_image_url`, `welcome_image_url`, `goodbye_image_url`: `image/png`, `image/jpeg`, `image/webp`, límite recomendado 5 MB.
5. Ejecuta `uploadAuto(buffer, mime)`.
6. Persiste la URL en `bot_profiles` con `upsertBotProfile`.
7. Actualiza `conn.botProfile` en memoria para que el cambio sea inmediato.
8. Responde con preview compacto y el enlace guardado.

### Contrato sugerido

```js
async function setBotMedia({ conn, m, field, allowedMimes }) {
  const { buffer, mime } = await readQuotedMedia(m)
  assertAllowedMime(mime, allowedMimes)
  const uploaded = await uploadAuto(buffer, mime)
  await upsertBotProfile(conn.session.id, { [field]: uploaded.url })
  conn.botProfile = await getBotProfile(conn.session.id)
  return uploaded.url
}
```

## Pilar 4: seguridad, permisos y estética

### Middleware de permisos

El sistema actual ya distingue owner global y creador del bot mediante `canManageBotSecurity(sender, conn)`. Se recomienda generalizarlo a un guard específico para edición de perfil:

```js
export function canManageBotProfile(sender, conn) {
  return isGlobalOwner(sender) || isBotCreator(sender, conn) || sender === conn?.botProfile?.ownerJid
}
```

Implementación propuesta:

- Agregar una propiedad estándar en plugins futuros: `handler.botProfileOwner = true`.
- Extender `PLUGIN_GUARDS` con una regla antes de `plugin.owner`:
  - Si `plugin.botProfileOwner` y `!canManageBotProfile(sender, conn)`, rechazar.
- Cargar `owner_jid` desde `bot_profiles` y sincronizarlo con `subbots.owner_jid`.
- Auditar comandos sensibles: `setbotname`, `setbotprefix`, `setbotmenu`, `setbotwelcome`, `setbotbye`, `resetbotprofile`.

### Seguridad adicional

- **Normalización JID:** usar siempre `normalizeSessionJid` para comparar dueño, bot y sender.
- **Rate limit:** aplicar cooldown corto a comandos de subida para evitar abuso de CDN.
- **Validación de prefijo:** longitud 1-3, sin espacios, sin caracteres invisibles, sin regex arbitraria.
- **Validación de nombre:** longitud 2-40, sanitizar saltos de línea, controlar caracteres RTL/invisibles.
- **Validación media:** MIME real desde buffer, tamaño máximo, `https`, y rechazar SVG/HTML.
- **Rollback:** si la subida funciona pero SQLite falla, responder error y no mutar `conn.botProfile`.

### Protección estética

Para preservar el estilo original aunque cambien nombre/media:

1. **Separar contenido de marco visual.** El usuario personaliza variables; el renderer controla bordes, fuentes y símbolos.
2. **Crear helpers tipográficos.** Centralizar `toFancy`, truncado visual y escape de Markdown en `src/library/typography.js`.
3. **Reservar anchos.** Truncar `botName` por ancho visual antes de interpolar en marcos largos.
4. **Templates con placeholders.** Ejemplo: `{botNameFancy}`, `{prefix}`, `{menuVideoUrl}`; no concatenación libre en el comando.
5. **Fallbacks obligatorios.** Si una URL personalizada falla, usar media local de Ruby para no romper el envío.
6. **Tests snapshot de strings.** Añadir pruebas que rendericen nombres cortos/largos y prefijos raros para verificar que los marcos no se rompen.

## Plan de acción por fases

### Fase 0: inventario y contratos

- Congelar los campos de `botProfile` y documentar defaults.
- Listar comandos que muestran identidad Ruby para migración gradual.
- Definir límites de media y validadores compartidos.

### Fase 1: persistencia e hidratación

- Crear tabla `bot_profiles` y módulo store.
- Hidratar `conn.botProfile` al iniciar bot principal y cada sub-bot.
- Compilar `conn.prefix` desde `botProfile.customPrefix`.
- Añadir `botProfile` al contexto de ejecución.

### Fase 2: renderers dinámicos

- Refactorizar `menuall` para usar `profile.botName`, `profile.menuVideoUrl` y fallback local.
- Refactorizar `_welcome` para usar `profile.welcomeImageUrl`/`profile.goodbyeImageUrl` y comandos con prefijo dinámico.
- Extraer helpers visuales y no tocar todavía comandos individuales no críticos.

### Fase 3: upload/CDN compartido

- Convertir el código funcional de `tourl` en `uploadAuto(buffer, mime)` reutilizable.
- Reemplazar `tourl` para consumir `uploadAuto` y evitar duplicación.
- Añadir timeouts/fallbacks por provider.

### Fase 4: comandos de edición

- Implementar `setbotname`, `setbotprefix`, `setbotmenu`, `setbotwelcome`, `setbotbye`, `botprofile`, `resetbotprofile`.
- Marcar comandos con `handler.botProfileOwner = true`.
- Actualizar perfil en DB y memoria atómicamente.

### Fase 5: endurecimiento y pruebas

- Pruebas unitarias de schema, permisos y renderers.
- Pruebas manuales con bot principal y sub-bot.
- Pruebas de reconexión: cambiar perfil, desconectar, reconectar y verificar persistencia.

## Riesgos principales

- Muchos comandos contienen `Ruby` en textos auxiliares; conviene migrarlos por prioridad para no bloquear el MVP.
- Algunos menús usan `#` literal dentro del template; si el prefijo cambia, deben depender de `usedPrefix`/`botProfile.customPrefix`.
- El media remoto de CDN puede expirar; guardar `provider` y timestamps en `meta_json` ayuda a diagnosticar.
- Cambiar `global.prefix` rompería todo el ecosistema; la ruta segura es `conn.prefix` por sesión con fallback global.
