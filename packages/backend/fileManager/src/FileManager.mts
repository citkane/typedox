import { CategoryKind, DoxEvents, config, coreEventsApi } from '@typedox/core';
import { serialiserEventsApi } from '@typedox/serialiser';
import { log } from '@typedox/logger';
import path from 'path';
import fs from 'fs';
import { fileEventsApi } from './fileEventsApi.mjs';
import ts from 'typescript';

type eventsApi = fileEventsApi & serialiserEventsApi & coreEventsApi;
const events = new DoxEvents<eventsApi>(fileEventsApi, serialiserEventsApi);
const __filename = log.getFilename(import.meta.url);
const __dirname = path.dirname(__filename);

export class FileManager {
	private options: config.coreDoxOptions;
	constructor(options: config.coreDoxOptions) {
		log.info(log.identifier(this), 'FileManager is listening', '\n');

		this.options = options;
		this.saveEnumJson();
		events.on('serialiser.packageMenu.serialised', (menu) => {
			this.saveDataFile(menu, '_packageMenu.json');
		});
		events.on('serialiser.declaration.serialised', (declaration) => {
			const fileName = declaration.location.query + '.json';
			const success = this.saveDataFile(declaration, 'data', fileName);
			if (!success) log.error(log.identifier(this), fileName);
		});
		events.on('core.sourcefile.declareSourceFile', (filePath, meta) => {
			const fileData = fs.readFileSync(filePath, { encoding: 'utf8' });
			const fileName = `${meta.dirPath}/${meta.fileName}`;
			this.saveFile(fileData, 'sources', fileName);
		});
	}
	saveEnumJson() {
		this.saveDataFile(CategoryKind, '_categoryKind.json');
		this.saveDataFile(ts.SyntaxKind, '_syntaxKind.json');
	}
	saveDataFile = (data: object, ...args: string[]) => {
		try {
			const string = JSON.stringify(data, null, '\t');
			this.saveFile(string, ...args);
			return true;
		} catch (error) {
			log.error(log.identifier(this), 'Did not convert data to JSON');
			return false;
		}
	};
	saveFile = (data: string, ...args: string[]) => {
		const assetsDir = path.join(__dirname, '../../../frontend/assets');
		const filePath = path.join(assetsDir, ...args);
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(filePath, data);
	};
}
