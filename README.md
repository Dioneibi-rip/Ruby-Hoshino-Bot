<div align="center">
  <img src="https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby_Generated_Image_vdcokcvdcokcvdco.png" alt="Banner Ruby Hoshino Bot" width="100%">
</div>

<div align="center">

  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&pause=1000&color=E91E63&center=true&vCenter=true&width=650&lines=RUBY+HOSHINO+BOT;TU+IDOL+DE+WHATSAPP+MULTI+DEVICE;SQLITE+LOCAL+%2B+ALTO+RENDIMIENTO;INSTALACION+TERMUX+A+PRUEBA+DE+ERRORES" alt="Ruby Hoshino typing banner">

  <p><b>Bot de WhatsApp Multi Device con SQLite local, soporte multi-instancia y una experiencia de instalación cuidada para Termux, Linux y Windows.</b></p>

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

> [!WARNING]
> **AVISO IMPORTANTE:** este bot no está afiliado con `WhatsApp Inc.`. El uso indebido, spam o automatización agresiva puede causar la suspensión de tu cuenta. Úsalo bajo tu propia responsabilidad y con respeto por tu comunidad. 💖

> Ruby Hoshino Bot es una versión personalizada y editada de [Yuki Wa Bot](https://github.com/The-King-Destroy/YukiBot-MD), mantenida por [Dioneibi-rip](https://github.com/Dioneibi-rip).

---

## 🌟 ¿Qué hace especial a Ruby Hoshino?

| Pilar | Experiencia |
| :--- | :--- |
| ⚡ **Rendimiento premium** | Persistencia local rápida con `better-sqlite3` y arranque directo con `npm start`. |
| 🗄️ **SQLite local** | No requiere MongoDB, Redis obligatorio ni paneles externos: tus datos viven en `src/database/`. |
| 🤖 **Multi-instancia / JadiBots** | Ejecuta sub-bots desde la misma base del proyecto con sesiones en `RubyJadiBots`. |
| 👑 **Bot Primario** | Evita respuestas duplicadas cuando hay varias sesiones activas en un chat. |
| 🎀 **Comunidad y diversión** | Administración de grupos, bienvenidas, stickers, descargas, juegos, economía, búsquedas y herramientas. |
| 🔐 **Sesiones locales** | Las sesiones de Baileys se guardan localmente para reinicios más estables. |

---

## 📋 Requisitos rápidos

Antes de instalar, confirma que tienes:

- **Node.js 18 o superior** recomendado.
- **Git** para clonar el repositorio.
- **Python + make + compilador C/C++ + herramientas nativas** para compilar paquetes como `better-sqlite3`.
- Conexión estable a internet durante `npm install`.

> Punto crítico: Ruby Hoshino usa `better-sqlite3@^11.10.0`. En Android/Termux puede compilarse con `node-gyp`; por eso son obligatorios `python`, `make`, `clang`, `binutils`, `pkg-config` y `libsqlite`.

---

# 💎 Instalación Automática en Termux — Recomendada

Esta es la forma más segura para Android. El script `termux-install.sh` actualiza Termux, instala el kit pesado de compilación, limpia la caché de npm y ejecuta `npm install` con las dependencias correctas para evitar errores de `node-gyp`, `better-sqlite3` y módulos incompletos como `ws`.

```bash
pkg install git -y
```

```bash
git clone https://github.com/Dioneibi-rip/Ruby-Hoshino-Bot.git
```

```bash
cd Ruby-Hoshino-Bot
```

```bash
bash termux-install.sh
```

Cuando termine, inicia Ruby:

```bash
npm start
```

> Si Termux pregunta algo como `(Y/I/N/O/D/Z) [default=N]`, escribe `y` y presiona **Enter**.

---

# 🛠️ Instalación Manual en Termux

> ⚠️ **Nota importante:** instala Termux desde F-Droid. Algunas ROMs o arquitecturas pueden tardar más al compilar dependencias nativas.

<details>
<summary><b>🪼 Ver comandos manuales para Termux</b></summary>

```bash
termux-setup-storage
```

```bash
pkg update -y && pkg upgrade -y
```

```bash
pkg install nodejs git python make clang binutils pkg-config libsqlite -y
```

```bash
git clone https://github.com/Dioneibi-rip/Ruby-Hoshino-Bot.git
```

```bash
cd Ruby-Hoshino-Bot
```

```bash
npm cache clean --force
```

```bash
npm install
```

```bash
npm start
```

### Reactivar en Termux si el bot se detuvo

```bash
cd ~/Ruby-Hoshino-Bot
```

```bash
npm start
```

### Mantener Ruby 24/7 con PM2 en Termux

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

</details>

---

# 🐧 Linux / VPS Ubuntu-Debian

<details>
<summary><b>Ver instalación para Linux, VPS, Ubuntu o Debian</b></summary>

```bash
sudo apt update
```

```bash
sudo apt install nodejs npm git python3 make g++ build-essential pkg-config libsqlite3-dev -y
```

```bash
git clone https://github.com/Dioneibi-rip/Ruby-Hoshino-Bot.git
```

```bash
cd Ruby-Hoshino-Bot
```

```bash
npm cache clean --force
```

```bash
npm install
```

```bash
npm start
```

### Ejecución recomendada en VPS con PM2

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

</details>

---

# 🪟 Windows

<details>
<summary><b>Ver instalación para Windows</b></summary>

1. Instala **Node.js LTS** desde <https://nodejs.org/>.
2. Instala **Git for Windows** desde <https://git-scm.com/download/win>.
3. Instala **Python 3** desde <https://www.python.org/downloads/> y marca **Add python.exe to PATH**.
4. Instala **Visual Studio Build Tools** desde <https://visualstudio.microsoft.com/visual-cpp-build-tools/> con la carga **Desktop development with C++**.
5. Abre **PowerShell** y clona Ruby:

```powershell
git clone https://github.com/Dioneibi-rip/Ruby-Hoshino-Bot.git
```

```powershell
cd Ruby-Hoshino-Bot
```

```powershell
npm cache clean --force
```

```powershell
npm install
```

```powershell
npm start
```

> Si `node-gyp` falla, reinicia PowerShell para que Windows recargue las variables de entorno de Python y Visual Studio Build Tools.

</details>

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

```powershell
Remove-Item -Recurse -Force RubySessions
```

```powershell
npm start
```

---

## 💾 Base de datos SQLite local

Ruby Hoshino Bot usa SQLite como motor principal de persistencia local mediante `better-sqlite3`. Al iniciar, crea y usa archivos locales dentro de `src/database/`, incluyendo datos del bot y store de Baileys.

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

Este error significa que Node intentó compilar `better-sqlite3` y no encontró herramientas nativas del sistema.

#### Termux

```bash
pkg update -y && pkg upgrade -y
```

```bash
pkg install nodejs git python make clang binutils pkg-config libsqlite -y
```

```bash
npm cache clean --force
```

```bash
npm install
```

#### Ubuntu/Debian

```bash
sudo apt update
```

```bash
sudo apt install nodejs npm git python3 make g++ build-essential pkg-config libsqlite3-dev -y
```

```bash
npm install
```

#### Windows

Instala **Python 3** y **Visual Studio Build Tools** con **Desktop development with C++**. Luego ejecuta:

```powershell
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

## 🍉 Hostings recomendados

Si deseas que Ruby esté activa 24/7 sin depender de tu celular, te recomendamos estos servicios:

### AKIRAX HOST

- **Dashboard:** [`dash.akirax.net`](https://home.akirax.net)
- **Panel:** [`panel.akirax.net`](https://console.akirax.net)
- **Canal oficial:** [`Únete aquí`](https://whatsapp.com/channel/0029VbBCchVDJ6H6prNYfz2z)
- **Grupo de soporte:** [`Únete aquí`](https://chat.whatsapp.com/JxSZTFJN9J20TnsH7KsKTA)

### ౨ৎ SWALLOX HOST ౨ৎ

- **Dashboard:** [`dash.swallox.com`](https://dash.swallox.com)
- **Panel:** [`panel.swallox.com`](https://panel.swallox.com)
- **Canal oficial:** [`Únete aquí`](https://whatsapp.com/channel/0029Vb6I6zTEQIanas9U0N2I)
- **Grupo de soporte:** [`Únete aquí`](https://chat.whatsapp.com/Bzo7jcdivDGJc3thZrSyEC)

---

## ☁️ Despliegue rápido en la nube

<p align="center">
  <a href="https://heroku.com/deploy?template=https://github.com/Dioneibi-rip/Ruby-Hoshino-Bot"><img src="https://img.shields.io/badge/Deploy%20en%20Heroku-6762A6?style=for-the-badge&logo=heroku&logoColor=white" alt="Deploy Heroku"></a>
  <a href="https://repl.it/github/Dioneibi-rip/Ruby-Hoshino-Bot"><img src="https://img.shields.io/badge/Run%20en%20Replit-0D101E?style=for-the-badge&logo=replit&logoColor=white" alt="Run Replit"></a>
  <a href="https://dashboard.render.com/blueprint/new?repo=https%3A%2F%2Fgithub.com%2FDioneibi-rip%2FRuby-Hoshino-Bot"><img src="https://img.shields.io/badge/Deploy%20en%20Render-0468FF?style=for-the-badge&logo=render&logoColor=white" alt="Deploy Render"></a>
</p>

> Importante: las plataformas gratuitas pueden suspender procesos por inactividad. Para uso estable 24/7 se recomienda VPS o hosting especializado.

---

## 💬 Comunidad y canales oficiales

<p align="center">
  <a href="https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P">
    <img src="https://img.shields.io/badge/Canal%20Oficial-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Canal Oficial">
  </a>
  <a href="https://api.whatsapp.com/send/?phone=18093519169&text=Hola,+vengo+de+GitHub+y+necesito+soporte+con+Ruby+Bot&type=phone_number&app_absent=0">
    <img src="https://img.shields.io/badge/Contacto%20de%20Soporte-FF5722?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Support Contact">
  </a>
</p>

---

## 🍋‍🟩 Desarrolladores

<a href="https://github.com/Dioneibi-rip/Ruby-Hoshino-Bot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Dioneibi-rip/Ruby-Hoshino-Bot" alt="Contribuidores Ruby Hoshino Bot">
</a>

## 🪷 Creador oficial

<a href="https://github.com/Dioneibi-rip"><img src="https://github.com/Dioneibi-rip.png" width="130" height="130" alt="Dioneibi-rip"></a>

<div align="center">

**¡Gracias por preferir a Ruby Hoshino!** 🫧💖

</div>
