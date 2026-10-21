@echo off
setlocal
title Front Page Lab - Local Demo

rem ---------------------------------------------------------------------------
rem  One-click launcher for the newspaper demo.
rem  Double-click the desktop .bat, or run: launch-demo.bat nobrowser
rem  Close this window to stop the local server.
rem ---------------------------------------------------------------------------

set "PROJECT=D:\Users\bolun\Documents\deepseek-harness\project"
set "PORT=5173"
set "URL=http://127.0.0.1:%PORT%/"
set "NO_BROWSER="
if /i "%~1"=="nobrowser" set "NO_BROWSER=1"

if not exist "%PROJECT%\server.mjs" (
  echo.
  echo [ERROR] Project not found:
  echo         %PROJECT%
  echo         Edit this file and update the PROJECT path.
  pause
  exit /b 1
)
cd /d "%PROJECT%" || (
  echo [ERROR] Cannot open project folder.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [ERROR] Node.js not found.
  echo         Install Node.js 18+ and make sure "node" is on PATH.
  pause
  exit /b 1
)

rem If this demo is already running, just open it.
powershell.exe -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:%PORT%/' -TimeoutSec 1; if ($r.StatusCode -eq 200 -and $r.Content -match 'FRONT PAGE LAB') { exit 0 } } catch {}; exit 1"
if not errorlevel 1 (
  echo.
  echo   Demo is already running at %URL%
  if not defined NO_BROWSER start "" "%URL%"
  ping -n 3 127.0.0.1 >nul
  exit /b 0
)

echo.
echo   Front Page Lab - starting local demo on port %PORT%
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
