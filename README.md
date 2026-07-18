<div align="center">
  <img src="https://raw.githubusercontent.com/Dioneibi-rip/imagenes/refs/heads/main/Ruby_Generated_Image_vdcokcvdcokcvdco.png" alt="Banner Ruby Hoshino Bot" width="100%">
</div>

<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&pause=1000&color=E91E63&center=true&vCenter=true&width=435&lines=BIENVENIDO+AL+REPOSITORIO;RUBY+HOSHINO+BOT;LA+IDOL+DEFINITIVA+EN+WHATSAPP;CREADO+CON+%E2%9D%A4%EF%B8%8F+POR+DIONEIBI;%C2%A1LA+BOT+MAS+LINDA!+%F0%9F%92%96" alt="Typing SVG">

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

> [!WARNING]
> **AVISO IMPORTANTE** > Este bot no está afiliado con `WhatsApp Inc.`. El uso indebido (spam, etc.) podría resultar en la `suspensión` de tu cuenta de WhatsApp.  
> **Úsalo bajo tu propio riesgo y responsabilidad.** ¡Sé un usuario amable! 💖

> Ruby Hoshino Bot es una versión personalizada y editada de [Yuki Wa Bot](https://github.com/The-King-Destroy/YukiBot-MD), mantenida por [Dioneibi-rip](https://github.com/Dioneibi-rip).

---

### <img src="https://i.pinimg.com/originals/19/80/6e/19806e91932e6054965fc83b85241270.gif" alt="Prueba La Bot Aqui" width="42" height="42"> ¡Prueba el Bot en Acción!

> ¿Quieres ver la magia de Ruby antes de instalar? ¡Únete a la comunidad y pruébalo! 💖

[**Únete al Grupo Oficial**](https://chat.whatsapp.com/D070oCPt4it7M2MohvYoOn)

-----

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

> 🚩 ESCRIBE LOS SIGUIENTES COMANDOS UNO POR UNO: 

## <img src="https://i.giphy.com/media/nWGRHBnAl5Kmc/giphy.gif" alt="Instalacion" width="40" height="40"> Instalación en [termux](https://f-droid.org/repo/com.termux_118.apk)

> ⚠️ **Nota Importante:** La bot no es 100% compatible con Termux y puede presentar fallos o no funcionar correctamente en algunos dispositivos. Se recomienda el uso de Cloud Shell o despliegue en la nube para una mejor experiencia.

> Recomendación: instala Termux desde F-Droid. Algunas ROMs o arquitecturas pueden requerir más tiempo para compilar dependencias nativas.

<details>
<summary><b>🪼 PASOS DE INSTALACION EN TERMUX</b></summary>

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

</details>

---

### Instalación en Linux / VPS Ubuntu-Debian

<details>
<summary><b>🐧 VER LOS PASOS DE INSTALACIÓN</b></summary>

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

</details>

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

## 🍉︎ **`HOSTINGS RECOMENDADOS`**

Si deseas que Ruby esté activa 24/7 sin depender de tu celular, te recomendamos estos servicios:

### **`AKIRAX HOST`**

* **Dashboard:** [`dash.akirax.net`](https://home.akirax.net)
* **Panel:** [`panel.akirax.net`](https://console.akirax.net)
* **Canal Oficial:** [`Únete Aquí`](https://whatsapp.com/channel/0029VbBCchVDJ6H6prNYfz2z)
* **Grupo de Soporte:** [`Únete Aquí`](https://chat.whatsapp.com/JxSZTFJN9J20TnsH7KsKTA)

### **`౨ৎ SWALLOX HOST ౨ৎ`**

* **Dashboard:** [`dash.swallox.com`](https://dash.swallox.com)
* **Panel:** [`panel.swallox.com`](https://panel.swallox.com)
* **Canal Oficial:** [`Únete Aquí`](https://whatsapp.com/channel/0029Vb6I6zTEQIanas9U0N2I)
* **Grupo de Soporte:** [`Únete Aquí`](https://chat.whatsapp.com/Bzo7jcdivDGJc3thZrSyEC)

---

## ☁️ **`DESPLIEGUE RÁPIDO EN LA NUBE`**

<p align="center">
  <a href="https://heroku.com/deploy?template=https://github.com/Dioneibi-rip/Ruby-Hoshino-Bot"><img src="https://img.shields.io/badge/Deploy%20en%20Heroku-6762A6?style=for-the-badge&logo=heroku&logoColor=white" alt="Deploy Heroku"></a>
  <a href="https://repl.it/github/Dioneibi-rip/Ruby-Hoshino-Bot"><img src="https://img.shields.io/badge/Run%20en%20Replit-0D101E?style=for-the-badge&logo=replit&logoColor=white" alt="Run Replit"></a>
  <a href="https://dashboard.render.com/blueprint/new?repo=https%3A%2F%2Fgithub.com%2FDioneibi-rip%2FRuby-Hoshino-Bot"><img src="https://img.shields.io/badge/Deploy%20en%20Render-0468FF?style=for-the-badge&logo=render&logoColor=white" alt="Deploy Render"></a>
</p>

> Importante: plataformas gratuitas pueden suspender procesos por inactividad. Para uso estable 24/7 se recomienda VPS o hosting especializado.

---

## 💬 **`COMUNIDAD Y CANALES OFICIALES`**

¿Tienes dudas o quieres estar al día con las novedades? ¡Únete a nuestros canales oficiales! 💫

<p align="center">
  <a href="https://whatsapp.com/channel/0029VakLbM76mYPPFL0IFI3P">
    <img src="https://img.shields.io/badge/Canal%20Oficial-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Canal Oficial">
  </a>
  <a href="https://api.whatsapp.com/send/?phone=18093519169&text=Hola,+vengo+de+GitHub+y+necesito+soporte+con+Ruby+Bot&type=phone_number&app_absent=0">
    <img src="https://img.shields.io/badge/Contacto%20de%20Soporte-FF5722?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Support Contact">
  </a>
</p>

---

### `🍋‍🟩 𝘿𝙀𝙎𝘼𝙍𝙍𝙊𝙇𝙇𝘼𝘿𝙊𝙍𝙀𝙎`
<a href="https://github.com/Dioneibi-rip/Ruby-Hoshino-Bot/graphs/contributors">
<img src="https://contrib.rocks/image?repo=Dioneibi-rip/Ruby-Hoshino-Bot" /> 
</a>

### `🪷 𝘾𝙍𝙀𝘼𝘿𝙊𝙍 𝙊𝙁𝙄𝘾𝙄𝘼𝙇`
<a
href="https://github.com/Dioneibi-rip"><img src="https://github.com/Dioneibi-rip.png" width="130" height="130" alt="David"/></a>


**`¡GRACIAS POR PREFERIRNOS!` 🫧**
