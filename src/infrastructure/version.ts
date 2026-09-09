import { version } from "../../package.json";

export const platformVersion = version;
export const platformLabel = version.replace(/^(\d+)\.(\d+)\.\d+-beta\.(\d+)$/, "V$1.$2 BETA$3");
