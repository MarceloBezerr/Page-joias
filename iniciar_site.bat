@echo off
title Ana Brille - Servidor Local
echo ========================================================
echo             ANA BRILLE - JOIAS E ACESSORIOS
echo ========================================================
echo.
echo Iniciando servidor local na porta 3000...
echo Abrindo seu navegador em http://localhost:3000/
echo.
start http://localhost:3000/
python -m http.server 3000
if %errorlevel% neq 0 (
    echo.
    echo Python nao encontrado. Abrindo diretamente o index.html...
    start index.html
)
pause
