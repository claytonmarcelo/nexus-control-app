@echo off
chcp 65001 >nul
echo ===================================================
echo     NEXUS CONTROL APP - Iniciador Automático
echo ===================================================
echo.
echo 1) Encerrando processos antigos (Node.js) para liberar portas...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo 2) Iniciando o Banco de Dados, Backend (API) e Frontend...
echo.
echo O navegador será aberto em instantes...
echo Mantenha esta janela aberta enquanto estiver usando o sistema.
echo ===================================================
echo.

:: Abre o navegador local 5 segundos depois, dando tempo do servidor iniciar
start "" cmd /c "timeout /t 5 >nul && start http://localhost:5173/login"

:: Inicia os servidores simultaneamente
npm run dev
pause
