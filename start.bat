@echo off
setlocal
chcp 65001 >nul
title Front Page Lab - Local Demo

rem Portable launcher: works after unzipping to any folder.
cd /d "%~dp0"

set "PORT=5173"
set "URL=http://127.0.0.1:%PORT%/"
set "NO_BROWSER="
if /i "%~1"=="nobrowser" set "NO_BROWSER=1"

if not exist "server.mjs" (
  echo.
  echo [ERROR] server.mjs not found.
  echo         Please run this file from the project root.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [ERROR] Node.js not found.
  echo         Install Node.js 18+ from https://nodejs.org/ and make sure "node" is on PATH.
  pause
  exit /b 1
)

rem If the demo is already running, just open it.
powershell.exe -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:%PORT%/' -TimeoutSec 1; if ($r.StatusCode -eq 200) { exit 0 } } catch {}; exit 1"
if not errorlevel 1 (
  echo.
  echo   Demo is already running at %URL%
  if not defined NO_BROWSER start "" "%URL%"
  ping -n 3 127.0.0.1 >nul
  exit /b 0
)

echo.
echo   Front Page Lab - starting local demo
echo   URL: %URL%
echo   Close this window to stop the server.
echo.

if not defined NO_BROWSER (
  start "" /b powershell.exe -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process '%URL%'"
)

node server.mjs
set "EXITCODE=%ERRORLEVEL%"
echo.
echo Server stopped with exit code %EXITCODE%.
pause
exit /b %EXITCODE%
