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
node server\content-host.mjs --host 127.0.0.1 --port 8765
if errorlevel 1 goto failed
popd
pause
exit /b 0
:missing_node
echo 请先安装 Node.js 22.18.0 或更高版本。
:failed
echo 启动未完成，请保留上方报错。依赖检查日志位于 .ceptlens-runtime\startup-last.log
echo 最近一次失败会另存为 .ceptlens-runtime\startup-failed.log。
pause
popd
exit /b 1
