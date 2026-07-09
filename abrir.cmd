@echo off
rem Abre o px_financeiro: inicia o servidor e abre o navegador automaticamente.
rem Mantenha esta janela aberta enquanto usa o app; feche-a para encerrar.
cd /d "%~dp0"
npm run dev -- --open
