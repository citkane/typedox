import { DoxEvents, config } from '@typedox/core';
import { serialiserEventsApi } from '@typedox/serialiser';
import { log } from '@typedox/logger';
import path from 'path';
import fs from 'fs';
import { fileEventsApi } from './fileEventsApi.mjs';

type eventsApi = fileEventsApi & serialiserEventsApi;

export class FileManager {
	events: DoxEvents<eventsApi>;
	options: config.doxOptions;
	constructor(options: config.doxOptions) {
		log.info(log.identifier(this), 'FileManager is listening', '\n');
		this.options = options;

		this.events = new DoxEvents<eventsApi>(
			fileEventsApi,
			serialiserEventsApi,
		);

		this.events.on('serialiser.mainMenu.serialised', (menu) => {
			this.saveJsonFile(menu, 'doxMenu.json');
		});
	}
	saveJsonFile = (data: object, ...args: string[]) => {
		const filePath = path.join(
			this.options.projectRootDir,
			this.options.doxOut,
			...args,
		);
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir);
		const json = JSON.stringify(data, null, '\t');
		fs.writeFileSync(filePath, json);
	};
}
