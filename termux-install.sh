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

print_step "Instalando dependencias pesadas para compilar Ruby Hoshino..."
pkg install nodejs git python make clang binutils pkg-config libsqlite -y

print_step "Limpiando caché de npm para evitar instalaciones corruptas..."
npm cache clean --force

print_step "Compilando bot e instalando módulos de Node.js..."
npm install

print_step "Instalación completada con éxito"
echo "✨ Ruby Hoshino está lista. Inicia el bot con: npm start"
echo "📱 Si Termux solicita permisos de almacenamiento, ejecuta: termux-setup-storage"
