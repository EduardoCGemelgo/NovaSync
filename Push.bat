@echo off
echo.
echo ================================
echo   Atualizando site - NovaSync
echo ================================
echo.

set /p mensagem="Descreva a alteracao feita: "

echo.
echo Adicionando arquivos...
git add .

echo Commitando...
git commit -m "%mensagem%"

echo Enviando para o GitHub...
git push

echo.
echo ================================
echo   Site atualizado com sucesso!
echo ================================
echo.
pause