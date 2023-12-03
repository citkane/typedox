import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';
import { CategoryKind, DoxEvents, config, coreEventsApi } from '@typedox/core';
import { serialiserEventsApi } from '@typedox/serialiser';
import { log } from '@typedox/logger';
import { fileEventsApi } from './fileEventsApi.mjs';

type eventsApi = fileEventsApi & serialiserEventsApi & coreEventsApi;
const events = new DoxEvents<eventsApi>(fileEventsApi, serialiserEventsApi);
const __filename = log.getFilename(import.meta.url);
const __dirname = dirname(__filename);

export class FileManager {
	private options: config.coreDoxOptions;
	constructor(options: config.coreDoxOptions) {
		log.info(log.identifier(this), 'FileManager is listening', '\n');

		this.options = options;
		this.saveEnumJson();
		events.on('serialiser.packageMenu.serialised', (menu) => {
			this.saveDataFile(menu, '_packageMenu.json');
		});
		events.on('serialiser.declarations.bundled', (filePath, bundle) => {
			this.saveDataFile(bundle, 'data', `${filePath}.json`);
		});
		events.on('core.sourcefile.declareSourceFile', (filePath, meta) => {
			const fileName = `${meta.dirPath}/${meta.fileName}`;
			this.saveFile(readFileSync(filePath, 'utf-8'), 'sources', fileName);
		});
	}
	saveEnumJson() {
		this.saveDataFile(CategoryKind, '_categoryKind.json');
		this.saveDataFile(ts.SyntaxKind, '_syntaxKind.json');
	}
	saveDataFile = (data: object, ...args: string[]) => {
		try {
			this.saveFile(JSON.stringify(data), ...args);
			return true;
		} catch (error) {
			log.error(log.identifier(this), error);
			return false;
		}
	};

	saveFile = (input: string, ...args: string[]) => {
		const assetsDir = join(__dirname, '../../../frontend/assets');
		const filePath = join(assetsDir, ...args) + '.gz';
		const dir = dirname(filePath);
		if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

		const compressed = gzipSync(input);
		writeFileSync(filePath, compressed);
	};
}
