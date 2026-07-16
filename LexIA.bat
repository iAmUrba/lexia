@echo off
title LexIA Launcher
color 0B
setlocal

echo ====================================================
echo                   LEXIA DESKTOP
echo ====================================================
echo.
echo Iniciando motor de LexIA...
echo Por favor espera un momento.

:: Iniciar el entorno completo de LexIA (Backend + Next.js) en segundo plano
start /B "LexIA_Backend" cmd /c "cd src\lexia-os && npm run dev"

:: Esperar un par de segundos para que el servidor Next.js inicie
timeout /t 5 /nobreak >nul

echo Abriendo la interfaz grafica...
:: Intentar abrir en Chrome (modo aplicacion) al puerto 3000 de Next.js
start chrome --app=http://localhost:3000

:: Si chrome no existe, usar msedge
if %errorlevel% neq 0 (
  start msedge --app=http://localhost:3000
)

:: El servidor seguira corriendo mientras esta ventana este abierta.
echo.
echo ====================================================
echo LexIA esta en ejecucion. 
echo Cierra esta ventana negra cuando termines de usar LexIA.
echo ====================================================
pause >nul
