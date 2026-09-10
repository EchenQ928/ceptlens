export function transientInstallFailure(output) {
  return /\b(?:EBUSY|EPERM|ECONNRESET|ETIMEDOUT|EAI_AGAIN|EINTEGRITY)\b|socket hang up|network timeout/i.test(output);
}

/** One readiness standard for first install, retry and later starts. */
export async function ensureDependencies({ installed, probe, install, wait, report }) {
  if (await installed()) {
    try { await probe(); return "existing"; }
    catch (error) { report(`现有依赖未通过运行检查：${error.message}\n将按锁文件重新安装。\n`); }
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    report(`依赖安装 ${attempt + 1}/2；请保持窗口开启。\n`);
    const result = await install();
    if (result.code !== 0) {
      // npm may report a cleanup failure after all required tools were installed.
      // Continue only on real readiness, not on the mere presence of folders.
      try {
        if (await installed()) {
          await probe();
          report(`警告：npm 返回 ${result.code ?? "启动异常"}，但依赖版本与关键工具运行检查全部通过。保留报错记录，继续启动，不重复安装。\n`);
          return "usable-with-warning";
        }
      } catch (error) { report(`安装报错后运行检查也未通过：${error.message}\n`); }
      if (attempt === 0 && transientInstallFailure(result.output)) {
        report("检测到网络、文件占用或缓存校验错误，稍后自动重试一次。\n");
        await wait(); continue;
      }
      throw new Error(`依赖尚不可用，npm 安装失败（退出码 ${result.code ?? "未能启动"}）。请查看日志中的 npm 原始报错。`);
    }
    try {
      if (!await installed()) throw new Error("安装后的依赖版本或文件不完整");
      await probe();
      return "installed";
    } catch (error) {
      if (attempt === 1) throw new Error(`安装后运行检查仍未通过：${error.message}`);
      report(`npm 已结束，但工具尚未就绪：${error.message}\n稍后自动修复安装一次。\n`);
      await wait();
    }
  }
}
