#!/data/data/com.termux/files/usr/bin/bash

set -Eeuo pipefail

PREFIX_DIR="${PREFIX:-/data/data/com.termux/files/usr}"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NPM_FLAGS=(--no-audit --no-fund)

print_step() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "💖 $1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

fail() {
  echo "❌ $*" >&2
  exit 1
}

if [[ "${OSTYPE:-}" != linux-android* && ! -d /data/data/com.termux/files/usr ]]; then
  fail "Este instalador está diseñado para Termux en Android."
fi

cd "$PROJECT_DIR"

print_step "Desinfectando variables tóxicas del sistema..."
# Borramos las líneas malas que Codex metió en tu .bashrc
if [ -f "$HOME/.bashrc" ]; then
  sed -i '/npm_config_/d' "$HOME/.bashrc"
  sed -i '/SHARP_FORCE_GLOBAL_LIBVIPS/d' "$HOME/.bashrc"
fi

# Las borramos de la memoria activa de esta sesión por si acaso
unset npm_config_python || true
unset npm_config_build_from_source || true
unset npm_config_platform || true
unset npm_config_target_platform || true
unset npm_config_arch || true
unset npm_config_target_arch || true
unset npm_config_sharp_libvips_global || true
unset SHARP_FORCE_GLOBAL_LIBVIPS || true

# Borramos archivos de configuración residuales
rm -f "$HOME/.npmrc"
rm -f "$PROJECT_DIR/.npmrc"

print_step "Actualizando repositorios de Termux"
pkg update -y && pkg upgrade -y

print_step "Evitando versiones no LTS de Node.js"
pkg remove -y nodejs nodejs-current 2>/dev/null || true

print_step "Instalando base de compilación nativa"
pkg install -y nodejs-lts git python make clang binutils pkg-config cmake

print_step "Instalando SQLite, imágenes/stickers y multimedia"
pkg install -y libsqlite libvips libwebp ffmpeg imagemagick

print_step "Configurando entorno Android/ARM64 limpio"
export CC="${PREFIX_DIR}/bin/clang"
export CXX="${PREFIX_DIR}/bin/clang++"
export PKG_CONFIG_PATH="${PREFIX_DIR}/lib/pkgconfig:${PREFIX_DIR}/share/pkgconfig:${PKG_CONFIG_PATH:-}"
export GYP_DEFINES="android_ndk_path= host_os=linux OS=android"

# Guardamos solo las variables buenas en el .bashrc
touch "$HOME/.bashrc"
grep -qxF "export CC=\"${PREFIX_DIR}/bin/clang\"" "$HOME/.bashrc" || echo "export CC=\"${PREFIX_DIR}/bin/clang\"" >> "$HOME/.bashrc"
grep -qxF "export CXX=\"${PREFIX_DIR}/bin/clang++\"" "$HOME/.bashrc" || echo "export CXX=\"${PREFIX_DIR}/bin/clang++\"" >> "$HOME/.bashrc"
grep -qxF "export GYP_DEFINES=\"android_ndk_path= host_os=linux OS=android\"" "$HOME/.bashrc" || echo "export GYP_DEFINES=\"android_ndk_path= host_os=linux OS=android\"" >> "$HOME/.bashrc"

print_step "Limpiando caché de npm para evitar rastros corruptos"
npm cache clean --force

print_step "Preparando instalación limpia de dependencias locales"
rm -rf node_modules

print_step "Preinyectando node-addon-api local para evitar fallos de Git"
npm install --no-save node-addon-api "${NPM_FLAGS[@]}"

print_step "Instalando dependencias del bot"
npm install "${NPM_FLAGS[@]}"

print_step "Forzando instalación de módulos de stickers"
npm install wa-sticker-formatter file-type "${NPM_FLAGS[@]}"

print_step "Instalando soporte de imágenes de respaldo (WASM)"
npm install --cpu=wasm32 sharp "${NPM_FLAGS[@]}"
npm install @img/sharp-wasm32 "${NPM_FLAGS[@]}"

print_step "Verificando módulos críticos"
node --input-type=module - <<'NODECHECK'
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