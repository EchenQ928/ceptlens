@echo off
setlocal
chcp 65001 >nul
pushd "%~dp0"
if errorlevel 1 goto failed
where node >nul 2>nul
if errorlevel 1 goto missing_node
node server\prepare-runtime.mjs
if errorlevel 1 goto failed
if exist dist\index.html goto serve
call npm run check
if errorlevel 1 goto failed
:serve
node server\content-host.mjs --host 0.0.0.0 --port 8765 --public-host 100.100.40.76
if errorlevel 1 goto failed
popd
pause
exit /b 0
:missing_node
echo Install Node.js 22.18.0 or newer before starting CeptLens.
:failed
echo Startup did not complete. Keep the error shown above.
echo Dependency logs: .ceptlens-runtime\startup-last.log and .ceptlens-runtime\startup-failed.log
pause
popd
exit /b 1
