export function resolveNpmInvocation(commandArgs, platform = process.platform, environment = process.env) {
  if (platform === "win32") {
    return {
      executable: environment.ComSpec || environment.COMSPEC || "cmd.exe",
      args: ["/d", "/s", "/c", "npm.cmd", ...commandArgs],
    };
  }
  return { executable: "npm", args: commandArgs };
}
