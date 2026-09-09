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
echo 请先安装 Node.js 22.18.0 或更高版本。
:failed
echo 启动未完成，请保留上方报错。依赖检查日志位于 .modelpath-runtime\startup-last.log
echo 最近一次失败会另存为 .modelpath-runtime\startup-failed.log，不会被第二次成功启动覆盖。
pause
popd
exit /b 1
