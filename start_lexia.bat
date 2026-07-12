@echo off
echo Iniciando LexIA a las %date% %time% >> lexia_autostart.log

echo Sincronizando con GitHub...
git pull origin main --rebase >> lexia_autostart.log 2>&1

cd src\lexia-os

echo Matando procesos en los puertos 3000 y 3001...
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :3000') DO (
  TaskKill.exe /F /PID %%T 2>NUL
)
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :3001') DO (
  TaskKill.exe /F /PID %%T 2>NUL
)

echo Levantando el servidor de LexIA...
npm run dev >> ..\..\lexia_autostart.log 2>&1
