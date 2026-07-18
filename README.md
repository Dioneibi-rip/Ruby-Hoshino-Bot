<div align="center">

<!-- Recomendado: reemplaza este bloque por un banner propio de 1280x420 px en /assets/banner.png -->
<img src="https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby_Generated_Image_vdcokcvdcokcvdco.png" alt="Ruby Hoshino Bot Banner" width="100%" />

# 💎 Ruby Hoshino Bot

**Bot de WhatsApp Multi Device con SQLite local, alto rendimiento y soporte multi-instancia.**

<p>
  <a href="https://github.com/Dioneibi-rip/Ruby-Hoshino-Bot"><img src="https://img.shields.io/github/stars/Dioneibi-rip/Ruby-Hoshino-Bot?style=for-the-badge&logo=github&color=ff4081" alt="GitHub stars"></a>
  <a href="https://github.com/Dioneibi-rip/Ruby-Hoshino-Bot/network/members"><img src="https://img.shields.io/github/forks/Dioneibi-rip/Ruby-Hoshino-Bot?style=for-the-badge&logo=github&color=d500f9" alt="GitHub forks"></a>
  <img src="https://img.shields.io/github/license/Dioneibi-rip/Ruby-Hoshino-Bot?style=for-the-badge&color=f50057" alt="License">
  <img src="https://img.shields.io/badge/SQLite-better--sqlite3%2011.10.0-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="better-sqlite3">
</p>

<p>
  <a href="https://chat.whatsapp.com/D070oCPt4it7M2MohvYoOn"><img src="https://img.shields.io/badge/Comunidad-Oficial-E91E63?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Grupo Oficial"></a>
  <a href="https://api.whatsapp.com/send/?phone=18093519169&text=Hola,+vengo+de+GitHub+y+necesito+soporte+con+Ruby+Bot&type=phone_number&app_absent=0"><img src="https://img.shields.io/badge/WhatsApp-Soporte-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Soporte WhatsApp"></a>
</p>

</div>

---

## ⚠️ Aviso importante

Ruby Hoshino Bot **no está afiliado con WhatsApp Inc.** El uso indebido, automatización agresiva o spam puede causar la suspensión de tu cuenta. Úsalo bajo tu propia responsabilidad y respeta las normas de tus comunidades.

> Ruby Hoshino Bot es una versión personalizada y editada de [Yuki Wa Bot](https://github.com/The-King-Destroy/YukiBot-MD), mantenida por [Dioneibi-rip](https://github.com/Dioneibi-rip).

---

## ✨ Características principales

| Pilar | Qué aporta |
| :--- | :--- |
| ⚡ **Rendimiento extremo** | Persistencia local rápida con `better-sqlite3`, menos latencia y arranque directo con `npm start`. |
| 🗄️ **SQLite puro** | No necesitas MongoDB, Redis obligatorio, cuentas externas ni paneles de base de datos. Los datos viven en `src/database/`. |
| 🤖 **Multi-instancia / JadiBots** | Permite ejecutar sub-bots desde la misma base del proyecto mediante sesiones en `RubyJadiBots`. |
| 👑 **Bot Primario** | Soporte para definir un bot principal por chat y evitar respuestas duplicadas cuando hay varias sesiones activas. |
| 🧩 **Funciones de comunidad** | Administración de grupos, bienvenidas, stickers, descargas, juegos, economía, búsquedas y herramientas de entretenimiento. |
| 🔐 **Sesiones locales** | Las sesiones de Baileys se guardan localmente para un reinicio más estable. |

---

## 📋 Requisitos rápidos

Antes de instalar, confirma que tienes:

- **Node.js 18 o superior** recomendado.
- **Git** para clonar el repositorio.
- **Python + compilador C++ + make/build tools** para compilar dependencias nativas como `better-sqlite3` si no existe binario precompilado para tu plataforma.
- Conexión estable a internet durante `npm install`.

> Punto crítico: Ruby Hoshino usa `better-sqlite3@^11.10.0`. Esta dependencia puede usar `node-gyp`, por lo que tu sistema debe tener herramientas de compilación nativa instaladas.

---

## 🚀 Instalación universal paso a paso

### 1) Termux / Android

> Recomendación: instala Termux desde F-Droid. Algunas ROMs o arquitecturas pueden requerir más tiempo para compilar dependencias nativas.

```bash
termux-setup-storage
```

```bash
pkg update -y && pkg upgrade -y
```

```bash
pkg install nodejs git python make clang binutils -y
```

```bash
git clone https://github.com/Dioneibi-rip/Ruby-Hoshino-Bot.git
```

```bash
cd Ruby-Hoshino-Bot
```

```bash
npm install
```

```bash
npm start
```

Si Termux pregunta algo como `(Y/I/N/O/D/Z) [default=N]`, escribe `y` y presiona **Enter**.

#### Reactivar en Termux si el bot se detuvo

```bash
cd ~/Ruby-Hoshino-Bot
```

```bash
npm start
```

#### Mantener Ruby 24/7 con PM2 en Termux

```bash
termux-wake-lock
```

```bash
npm install -g pm2
```

```bash
pm2 start index.js --name ruby-hoshino
```

```bash
pm2 save
```

```bash
pm2 logs ruby-hoshino
```

---

### 2) Linux / VPS Ubuntu-Debian

```bash
sudo apt update
```

```bash
sudo apt install nodejs npm git python3 build-essential -y
```

```bash
git clone https://github.com/Dioneibi-rip/Ruby-Hoshino-Bot.git
```

```bash
cd Ruby-Hoshino-Bot
```

```bash
npm install
```

```bash
npm start
```

#### Ejecución recomendada en VPS con PM2

```bash
sudo npm install -g pm2
```

```bash
pm2 start index.js --name ruby-hoshino
```

```bash
pm2 save
```

```bash
pm2 logs ruby-hoshino
```

---

### 3) Windows

1. Descarga e instala **Node.js LTS** desde <https://nodejs.org/>.
2. Descarga e instala **Git for Windows** desde <https://git-scm.com/download/win>.
3. Durante la instalación de Node.js, si aparece la opción **Tools for Native Modules**, actívala. Esto instala Python y herramientas C++ necesarias para paquetes nativos.
4. Abre **PowerShell como Administrador** y, si no tienes herramientas de compilación, ejecuta:

```bash
npm install --global windows-build-tools
```

> Nota: en versiones modernas de Windows/Node, también puedes instalar manualmente **Python 3** y **Visual Studio Build Tools** con la carga de trabajo **Desktop development with C++** si `windows-build-tools` no funciona.

5. Clona el repositorio:

```bash
git clone https://github.com/Dioneibi-rip/Ruby-Hoshino-Bot.git
```

```bash
cd Ruby-Hoshino-Bot
```

```bash
npm install
```

```bash
npm start
```

---

## 🔐 Primer inicio y vinculación con WhatsApp

1. Ejecuta `npm start`.
2. Sigue las instrucciones de la terminal para vincular WhatsApp mediante QR o código, según el modo disponible.
3. Mantén la terminal abierta mientras el bot está funcionando.
4. Si usas PM2, revisa los logs con `pm2 logs ruby-hoshino`.

### Obtener un nuevo código o limpiar sesión principal

```bash
cd Ruby-Hoshino-Bot
```

```bash
rm -rf RubySessions
```

```bash
npm start
```

En Windows PowerShell, usa:

```bash
Remove-Item -Recurse -Force RubySessions
```

```bash
npm start
```

---

## 💾 Base de datos SQLite local

Ruby Hoshino Bot usa SQLite como motor principal de persistencia local mediante `better-sqlite3`. Al iniciar, el bot crea y usa archivos locales dentro de `src/database/`, incluyendo datos del bot y store de Baileys.

Ventajas:

- Instalación más simple: no requiere MongoDB ni credenciales externas.
- Datos persistentes en archivos locales.
- Mejor rendimiento para operaciones frecuentes del bot.
- Configuración lista para producción con pragmas como WAL, `synchronous=NORMAL`, `busy_timeout`, caché en memoria y tablas temporales en RAM.

### Configuración opcional con `.env`

```bash
cp .env.example .env
```

Luego edita `.env` solo si necesitas ajustar límites o rutas avanzadas. Para la mayoría de usuarios basta con iniciar:

```bash
npm start
```

---

## 🧬 Multi-instancia: JadiBots y Bot Primario

Ruby Hoshino puede trabajar con múltiples sesiones:

- **Bot principal:** sesión estándar guardada en `RubySessions`.
- **JadiBots:** sub-bots o sesiones secundarias guardadas en `RubyJadiBots`.
- **Bot Primario por chat:** ayuda a decidir qué instancia responde en un grupo para reducir duplicados cuando hay más de un bot conectado.

Consejos operativos:

- No compartas carpetas de sesión públicamente.
- Haz respaldos antes de borrar `RubySessions`, `RubyJadiBots` o `src/database/`.
- Si varias instancias responden a la vez, revisa la configuración del bot primario del chat.

---

## 🧯 Solución de problemas

### Error: `better-sqlite3` / `node-gyp build failed`

Este error significa que Node intentó compilar `better-sqlite3` en tu equipo y no encontró las herramientas necesarias. La solución es instalar **Python**, **make** y un **compilador C++**.

#### Termux

```bash
pkg update -y && pkg upgrade -y
```

```bash
pkg install nodejs git python make clang binutils -y
```

```bash
npm install
```

#### Ubuntu/Debian

```bash
sudo apt update
```

```bash
sudo apt install nodejs npm git python3 build-essential -y
```

```bash
npm install
```

#### Windows

```bash
npm install --global windows-build-tools
```

Si el comando anterior falla, instala manualmente:

- Python 3 desde <https://www.python.org/downloads/> y marca **Add python.exe to PATH**.
- Visual Studio Build Tools desde <https://visualstudio.microsoft.com/visual-cpp-build-tools/> con **Desktop development with C++**.

Luego vuelve a ejecutar:

```bash
npm install
```

### Error: `python not found` o `gyp ERR! find Python`

Instala Python según tu sistema y verifica:

```bash
python --version
```

```bash
python3 --version
```

### Error: permisos al instalar dependencias globales

En Linux/VPS, usa `sudo` solo para paquetes globales si tu instalación lo requiere:

```bash
sudo npm install -g pm2
```

En Termux normalmente no uses `sudo`.

### El bot no inicia después de borrar sesiones

Vuelve a generar sesión:

```bash
npm start
```

Si el problema continúa, elimina solo la carpeta de sesión afectada y conserva `src/database/` si quieres mantener economía, niveles y datos del bot.

---

## ☁️ Despliegue en la nube

<p align="center">
  <a href="https://heroku.com/deploy?template=https://github.com/Dioneibi-rip/Ruby-Hoshino-Bot"><img src="https://img.shields.io/badge/Deploy%20en%20Heroku-6762A6?style=for-the-badge&logo=heroku&logoColor=white" alt="Deploy Heroku"></a>
  <a href="https://repl.it/github/Dioneibi-rip/Ruby-Hoshino-Bot"><img src="https://img.shields.io/badge/Run%20en%20Replit-0D101E?style=for-the-badge&logo=replit&logoColor=white" alt="Run Replit"></a>
  <a href="https://dashboard.render.com/blueprint/new?repo=https%3A%2F%2Fgithub.com%2FDioneibi-rip%2FRuby-Hoshino-Bot"><img src="https://img.shields.io/badge/Deploy%20en%20Render-0468FF?style=for-the-badge&logo=render&logoColor=white" alt="Deploy Render"></a>
</p>

> Importante: plataformas gratuitas pueden suspender procesos por inactividad. Para uso estable 24/7 se recomienda VPS o hosting especializado.

---

## 💬 Comunidad y soporte

- Grupo oficial: <https://chat.whatsapp.com/D070oCPt4it7M2MohvYoOn>
- Canal oficial: <https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P>
- Soporte directo: <https://api.whatsapp.com/send/?phone=18093519169&text=Hola,+vengo+de+GitHub+y+necesito+soporte+con+Ruby+Bot&type=phone_number&app_absent=0>

---

## 👥 Créditos

<a href="https://github.com/Dioneibi-rip/Ruby-Hoshino-Bot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Dioneibi-rip/Ruby-Hoshino-Bot" alt="Contributors" />
</a>

**Creador oficial:** [Dioneibi-rip](https://github.com/Dioneibi-rip)

<div align="center">

### Gracias por usar Ruby Hoshino Bot 💖

</div>
