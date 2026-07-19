#!/data/data/com.termux/files/usr/bin/bash

set -euo pipefail

print_step() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "💖 $1"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

print_step "Actualizando sistema y repositorios de Termux..."
pkg update -y && pkg upgrade -y

print_step "Eliminando Node.js inestable (v26+)..."
pkg remove nodejs -y || true

print_step "Instalando Node.js LTS y herramientas pesadas (SQLite, Sharp, FFmpeg)..."
pkg install nodejs-lts git python make clang binutils pkg-config libsqlite libvips ffmpeg libwebp -y

print_step "Inyectando variables para el NDK y guardando configuración..."
export GYP_DEFINES="android_ndk_path="

if ! grep -q 'android_ndk_path=' ~/.bashrc 2>/dev/null; then
  echo 'export GYP_DEFINES="android_ndk_path="' >> ~/.bashrc
fi

print_step "Limpiando caché de npm para evitar corrupciones..."
npm cache clean --force

print_step "Instalando puente de compilación C++ (Addon API)..."
npm install -g node-addon-api
npm install node-addon-api

print_step "Compilando bot e instalando módulos base..."
npm install

print_step "Forzando instalación de módulos de stickers faltantes..."
npm install wa-sticker-formatter file-type

print_step "Instalando soporte de imágenes de respaldo (WASM)..."
npm install --cpu=wasm32 sharp
npm install @img/sharp-wasm32

print_step "Instalación completada con éxito"
echo "✨ Ruby Hoshino está lista. Inicia el bot con: npm start"
echo "📱 Si Termux no tiene permisos de almacenamiento, ejecuta: termux-setup-storage"