import * as fs from 'fs';
import { join } from 'path';
const pkg = JSON.parse(fs.readFileSync(join(process.cwd(), '../package.json'), 'utf8'));
export const appVersion = pkg.version;
