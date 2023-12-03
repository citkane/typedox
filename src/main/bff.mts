import { log } from '@typedox/logger';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = log.getFilename(import.meta.url);
const thisDir = path.dirname(__filename);
const woffSubDir = 'src/css/materialSymbols/material-symbols-outlined.woff2';
const woffTgSubdir = 'css/material-symbols-outlined.woff2';

export function copyAssetsToDocs(docDir: string, frontendSrcDir: string) {
	const frontendPath = path.join(thisDir, '../', frontendSrcDir);
	const htmlIndexPath = path.join(frontendPath, 'index.html');
	const htmlIndexTarget = path.join(docDir, 'index.html');
	const assetsPath = path.join(frontendPath, 'assets');
	const assetsTarget = path.join(docDir, 'assets');
	const libDir = path.join(assetsPath, 'lib');

	const symbolWfSrc = path.join(frontendPath, woffSubDir);
	const purifySrc = require.resolve('dompurify/dist/purify.min.js');

	const markedSrc = require.resolve('marked/marked.min.js');
	const prSrc = require.resolve('prettier/standalone.js');
	const pakoSrc = require.resolve('pako/dist/pako_inflate.min.js');

	const prPlugSrc = require.resolve('prettier/plugins/estree.js');
	const prTsSrc = require.resolve('prettier/plugins/typescript.js');
	const shikiSrc = require.resolve('shiki/dist/index.browser.mjs');
	const siLangSrc = path.join(path.dirname(shikiSrc), '../languages');
	const siThemesSrc = path.join(path.dirname(shikiSrc), '../themes');
	const siWasmSrc = path.join(path.dirname(shikiSrc), 'onig.wasm');

	const symbolWfTarg = path.join(assetsPath, woffTgSubdir);
	const purifyTarg = path.join(libDir, 'marked', path.basename(purifySrc));
	const markedTarg = path.join(libDir, 'marked', path.basename(markedSrc));
	const pakoTarg = path.join(libDir, 'pako', path.basename(pakoSrc));
	const prTarg = path.join(libDir, 'prettier/prettier.js');
	const prPlugTarg = path.join(libDir, 'prettier/estree.js');
	const prTsTarg = path.join(libDir, 'prettier/typescript.js');
	const shikiTarg = path.join(libDir, 'shiki/shiki.mjs');
	const siLangTarg = path.join(libDir, 'shiki/languages');

	const siThemesTarg = path.join(libDir, 'shiki/themes');
	const siWasmTarg = path.join(libDir, 'shiki/onig.wasm');

	const prDir = path.dirname(prTarg);
	const markedDir = path.dirname(markedTarg);
	const fflateDir = path.dirname(pakoTarg);
	const woffDir = path.dirname(symbolWfTarg);
	!fs.existsSync(woffDir) && fs.mkdirSync(woffDir, { recursive: true });
	!fs.existsSync(docDir) && fs.mkdirSync(docDir, { recursive: true });
	!fs.existsSync(libDir) && fs.mkdirSync(libDir, { recursive: true });
	!fs.existsSync(prDir) && fs.mkdirSync(prDir, { recursive: true });
	!fs.existsSync(markedDir) && fs.mkdirSync(markedDir, { recursive: true });
	!fs.existsSync(fflateDir) && fs.mkdirSync(fflateDir, { recursive: true });

	fs.existsSync(siLangTarg) && fs.rmSync(siLangTarg, { recursive: true });
	fs.existsSync(siThemesTarg) && fs.rmSync(siThemesTarg, { recursive: true });
	fs.cpSync(siLangSrc, siLangTarg, { recursive: true });
	fs.cpSync(siThemesSrc, siThemesTarg, { recursive: true });

	fs.copyFileSync(symbolWfSrc, symbolWfTarg);
	fs.copyFileSync(shikiSrc, shikiTarg);
	fs.copyFileSync(siWasmSrc, siWasmTarg);
	fs.copyFileSync(purifySrc, purifyTarg);
	fs.copyFileSync(markedSrc, markedTarg);
	fs.copyFileSync(pakoSrc, pakoTarg);
	fs.copyFileSync(prSrc, prTarg);
	fs.copyFileSync(prPlugSrc, prPlugTarg);
	fs.copyFileSync(prTsSrc, prTsTarg);

	fs.existsSync(assetsTarget) && fs.rmSync(assetsTarget, { recursive: true });
	fs.cpSync(htmlIndexPath, htmlIndexTarget, { recursive: true });
	fs.cpSync(assetsPath, assetsTarget, { recursive: true });
}
