#!/bin/bash

# start_lexia.sh
# Este script levanta toda la infraestructura de LexIA (Web + Server).

export PATH=/Users/lacalma/.gemini/antigravity/scratch/LexIA/node-v20.11.1-darwin-x64/bin:$PATH

cd /Users/lacalma/.gemini/antigravity/scratch/LexIA/src/lexia-os

echo "Iniciando LexIA a las $(date)" >> ../../lexia_autostart.log

# Matar procesos existentes en los puertos 3000 y 3001
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

npm run dev >> ../../lexia_autostart.log 2>&1
