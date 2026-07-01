@echo off
echo =====================================
echo Enviando nova versao para o GitHub...
echo =====================================
cd /d "%~dp0"
echo.
echo Status atual do Git:
git status
echo.
set /p msg="Digite a mensagem do commit (ou aperte Enter para usar 'update'): "
if "%msg%"=="" set msg=update
echo.
echo Adicionando arquivos...
git add .
echo.
echo Criando commit com a mensagem: "%msg%"
git commit -m "%msg%"
echo.
echo Enviando para o GitHub (origin main)...
git push origin main
echo.
echo Concluido!
pause
