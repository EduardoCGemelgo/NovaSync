@echo off
chcp 65001 >nul
cd /d "C:\Users\edwar\AppData\Roaming\Open Design\namespaces\release-stable-win\data\projects\3083b058-69a1-477b-9ac0-1a1a54f2b907"

echo ============================================
echo  NovaSync - Push para GitHub (Branch: Site)
echo ============================================
echo.

echo [1/4] Verificando repositorio...
git status
echo.

echo [2/4] Adicionando arquivos...
git add -A
echo.

echo [3/4] Criando commit...
set /p MSG="Mensagem do commit (Enter para padrao 'Update Site'): "
if "%MSG%"=="" set MSG=Update Site
git commit -m "%MSG%"
echo.

echo [4/4] Push para origin/Site...
git push origin Site
echo.

echo ============================================
echo  Push concluido!
echo ============================================
pause