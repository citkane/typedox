import { log } from '@typedox/logger';
import fs from 'fs';
import path from 'path';

const __filename = log.getFilename(import.meta.url);
const thisDir = path.dirname(__filename);

export function copyAssetsToDocs(docDir: string, frontendSrcDir: string) {
	const frontendPath = path.join(thisDir, '../', frontendSrcDir);
	const htmlIndexPath = path.join(frontendPath, 'index.html');
	const htmlIndexTarget = path.join(docDir, 'index.html');
	const assetsPath = path.join(frontendPath, 'assets');
	const assetsTarget = path.join(docDir, 'assets');

	fs.cpSync(htmlIndexPath, htmlIndexTarget, { recursive: true });
	fs.cpSync(assetsPath, assetsTarget, { recursive: true });
}
