@echo off
echo Starting Nivel Arena Online...

:: Start Server in a new window
start "Nivel Arena Server" cmd /k "cd server && npm run dev"

:: Start Client in a new window
start "Nivel Arena Client" cmd /k "npm run dev"

echo Server and Client processes have been launched in separate windows.
echo Please wait a moment for them to initialize.
echo Client: http://localhost:3000
