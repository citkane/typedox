import { log } from '@typedox/logger';
import fs from 'fs';
import path from 'path';

const __filename = log.getFilename(import.meta.url);
const thisDir = path.dirname(__filename);

export function copyAssetsToDocs(
	projectRoot: string,
	docDir: string,
	frontendSrcDir: string,
) {
	const docPath = path.join(projectRoot, docDir);
	const frontendPath = path.join(thisDir, '../', frontendSrcDir);
	const htmlIndexPath = path.join(frontendPath, 'index.html');
	const htmlIndexTarget = path.join(docPath, 'index.html');
	const assetsPath = path.join(frontendPath, 'assets');
	const assetsTarget = path.join(docPath, 'assets');

	fs.cpSync(htmlIndexPath, htmlIndexTarget, { recursive: true });
	fs.cpSync(assetsPath, assetsTarget, { recursive: true });
}
