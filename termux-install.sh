#!/data/data/com.termux/files/usr/bin/bash

set -Eeuo pipefail

PREFIX_DIR="${PREFIX:-/data/data/com.termux/files/usr}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NPM_FLAGS=(--no-audit --no-fund --foreground-scripts)

print_step() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "💖 $1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

warn() {
  echo "⚠️  $*"
}

fail() {
  echo "❌ $*" >&2
  exit 1
}

run_pkg_install() {
  local label="$1"
  shift
  print_step "Instalando paquetes de Termux: ${label}"
  pkg install -y "$@"
}

try_pkg_install() {
  local label="$1"
  shift
  print_step "Intentando instalar paquetes opcionales: ${label}"
  if ! pkg install -y "$@"; then
    warn "Algunos paquetes opcionales no están disponibles en este repositorio de Termux. Continuando..."
  fi
}

persist_line() {
  local line="$1"
  touch "$HOME/.bashrc"
  if ! grep -Fqx "$line" "$HOME/.bashrc"; then
    printf '%s\n' "$line" >> "$HOME/.bashrc"
  fi
}

if [[ "${OSTYPE:-}" != linux-android* && ! -d /data/data/com.termux/files/usr ]]; then
  fail "Este instalador está diseñado para Termux en Android. En Linux/VPS usa npm install normal."
fi

cd "$PROJECT_DIR"

print_step "Actualizando repositorios de Termux"
pkg update -y
pkg upgrade -y

print_step "Evitando versiones no LTS de Node.js"
pkg remove -y nodejs nodejs-current 2>/dev/null || true

run_pkg_install "base de compilación nativa" \
  nodejs-lts git python make clang binutils pkg-config cmake ninja patchelf

run_pkg_install "SQLite, imágenes/stickers y multimedia" \
  libsqlite libvips libwebp ffmpeg imagemagick

try_pkg_install "soporte para canvas/cairo si una dependencia lo requiere" \
  cairo pango pixman freetype fontconfig libjpeg-turbo giflib librsvg

print_step "Configurando entorno Android/ARM64 para node-gyp, sharp y sqlite"
export CC="${PREFIX_DIR}/bin/clang"
export CXX="${PREFIX_DIR}/bin/clang++"
export AR="${PREFIX_DIR}/bin/ar"
export LD="${PREFIX_DIR}/bin/ld"
export PKG_CONFIG_PATH="${PREFIX_DIR}/lib/pkgconfig:${PREFIX_DIR}/share/pkgconfig:${PKG_CONFIG_PATH:-}"
export npm_config_python="${PREFIX_DIR}/bin/python"
export npm_config_build_from_source="true"
export npm_config_platform="android"
export npm_config_arch="$(node -p 'process.arch')"
export npm_config_target_platform="android"
export npm_config_target_arch="$npm_config_arch"
export npm_config_sharp_libvips_global="true"
export SHARP_FORCE_GLOBAL_LIBVIPS="1"
export GYP_DEFINES="android_ndk_path= host_os=linux OS=android"

persist_line "export CC=\"${PREFIX_DIR}/bin/clang\""
persist_line "export CXX=\"${PREFIX_DIR}/bin/clang++\""
persist_line "export PKG_CONFIG_PATH=\"${PREFIX_DIR}/lib/pkgconfig:${PREFIX_DIR}/share/pkgconfig:\${PKG_CONFIG_PATH:-}\""
persist_line "export npm_config_python=\"${PREFIX_DIR}/bin/python\""
persist_line "export npm_config_build_from_source=\"true\""
persist_line "export npm_config_platform=\"android\""
persist_line "export npm_config_target_platform=\"android\""
persist_line "export npm_config_sharp_libvips_global=\"true\""
persist_line "export SHARP_FORCE_GLOBAL_LIBVIPS=\"1\""
persist_line "export GYP_DEFINES=\"android_ndk_path= host_os=linux OS=android\""

print_step "Normalizando configuración de npm"
npm config set python "$npm_config_python"
npm config set build-from-source true
npm config set platform android
npm config set target_platform android
npm config set arch "$npm_config_arch"
npm config set target_arch "$npm_config_arch"
npm config set fetch-retries 5
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm cache verify || npm cache clean --force

print_step "Instalando herramientas globales usadas por módulos nativos y dependencias GitHub"
npm install -g node-gyp node-addon-api prebuild-install node-pre-gyp "${NPM_FLAGS[@]}"

print_step "Preparando instalación limpia de dependencias locales"
rm -rf node_modules

print_step "Preinyectando node-addon-api local para evitar git dep preparation failed"
npm install --no-save node-addon-api "${NPM_FLAGS[@]}"

print_step "Instalando dependencias del bot desde cero"
npm install "${NPM_FLAGS[@]}"

print_step "Verificando módulos críticos"
node - <<'NODECHECK'
const modules = ['better-sqlite3', 'wa-sticker-formatter'];
for (const name of modules) {
  try {
    await import(name);
    console.log(`✅ ${name} OK`);
  } catch (error) {
    console.error(`❌ ${name} falló: ${error.message}`);
    process.exitCode = 1;
  }
}
NODECHECK

print_step "Instalación completada con éxito"
echo "✨ Ruby Hoshino está lista. Inicia el bot con: npm start"
echo "📱 Si Termux no tiene permisos de almacenamiento, ejecuta: termux-setup-storage"
