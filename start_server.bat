@echo off
setlocal enabledelayedexpansion

echo [Nivel Arena] Server Bootstrapping...

:: Try to set execution policy for the process if possible
powershell -Command "Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass"

:: Navigate to server directory
cd /d "c:\Users\worke\Antigravity\nivel_arena_online\server"

:: Run the server directly using ts-node to avoid .ps1 wrapper issues
echo [Nivel Arena] Starting server with ts-node index.ts...
cmd /c "npx ts-node index.ts"

if %ERRORLEVEL% neq 0 (
    echo [Nivel Arena] Server failed to start.
    pause
)
