@echo off
setlocal
chcp 65001 >nul
pushd "%~dp0"
if errorlevel 1 goto failed
where node >nul 2>nul
if errorlevel 1 goto missing_node
node server\prepare-runtime.mjs
if errorlevel 1 goto failed
call npm start
if errorlevel 1 goto failed
popd
exit /b 0
:missing_node
echo Install Node.js 22.18.0 or newer before starting the Content Lab.
:failed
echo Content Lab startup did not complete. Keep the error shown above.
echo Dependency logs: .modelpath-runtime\startup-last.log and .modelpath-runtime\startup-failed.log
pause
popd
exit /b 1
