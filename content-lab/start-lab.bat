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
echo 请先安装 Node.js 22.18.0 或更高版本。
:failed
echo 实验室启动未完成，请保留上方报错。请勿关闭其他正式平台终端。
echo 依赖检查日志位于 .modelpath-runtime\startup-last.log，最近失败另存为 startup-failed.log。
pause
popd
exit /b 1
