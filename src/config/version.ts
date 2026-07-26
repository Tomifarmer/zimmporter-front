import * as fs from "node:fs";
import { join } from "node:path";

const pkg = JSON.parse(fs.readFileSync(join(process.cwd(), "../package.json"), "utf8"));
export const appVersion = pkg.version;
