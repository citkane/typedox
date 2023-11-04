import { CategoryKind, DoxEvents, config } from '@typedox/core';
import { serialiserEventsApi } from '@typedox/serialiser';
import { log } from '@typedox/logger';
import path from 'path';
import fs from 'fs';
import { fileEventsApi } from './fileEventsApi.mjs';
import ts from 'typescript';

type eventsApi = fileEventsApi & serialiserEventsApi;
const __filename = log.getFilename(import.meta.url);
const __dirname = path.dirname(__filename);

export class FileManager {
	private events: DoxEvents<eventsApi>;
	private options: config.doxOptions;
	constructor(options: config.doxOptions) {
		log.info(log.identifier(this), 'FileManager is listening', '\n');

		this.options = options;
		this.saveEnumJson();
		this.events = new DoxEvents<eventsApi>(
			fileEventsApi,
			serialiserEventsApi,
		);
		this.events.on('serialiser.mainMenu.serialised', (menu) => {
			this.saveDataFile(menu, '../assets/_mainMenu.json');
		});
	}
	saveEnumJson() {
		this.saveDataFile(CategoryKind, '../assets/_categoryKind.json');
		this.saveDataFile(ts.SyntaxKind, '../assets/_syntaxKind.json');
	}
	saveDataFile = (data: object, ...args: string[]) => {
		const assetsDir = path.join(__dirname, '../../../frontend/assets');
		const filePath = path.join(assetsDir, ...args);
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
		const string = JSON.stringify(data, null, '\t');
		fs.writeFileSync(filePath, string);
	};
}
