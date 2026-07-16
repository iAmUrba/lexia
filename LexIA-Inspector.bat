@echo off
title LexIA Inspector
color 0B
setlocal

echo ====================================================
echo                 LEXIA INSPECTOR (BETA)
echo ====================================================
echo.
echo Abriendo ventana para seleccionar el expediente...

:: Usamos PowerShell para abrir el selector de carpetas nativo de Windows
for /f "delims=" %%I in ('powershell -command "Add-Type -AssemblyName System.Windows.Forms; $f = New-Object System.Windows.Forms.FolderBrowserDialog; $f.Description = 'Selecciona la carpeta del expediente para que LexIA lo audite'; $f.ShowNewFolderButton = $false; if($f.ShowDialog() -eq 'OK'){ $f.SelectedPath }"') do set "folderPath=%%I"

if "%folderPath%"=="" (
    echo.
    echo [!] Operacion cancelada. No seleccionaste ninguna carpeta.
    echo.
    pause
    exit /b
)

echo.
echo [lexia] Analizando expediente en:
echo "%folderPath%"
echo.
echo ██████████████░░░░░░░░░░ Procesando...
echo.

:: Ejecutamos el CLI
call npx tsx src\lexia-os\apps\cli\bin\lexia.ts inspect-case "%folderPath%"

echo.
echo [lexia] Inspeccion finalizada. 
echo Si se genero un archivo HTML, puedes abrirlo en tu navegador.
echo.
pause
