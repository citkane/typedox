import { DoxEvents, DoxProject, config } from '@typedox/core';
import { log } from '@typedox/logger';
import { serialiserEventsApi } from './serialiserEventsApi.mjs';
import { mainEventsApi } from 'typedox/events';
import { serialiseDoxProject } from './index.mjs';

type eventsApi = mainEventsApi & serialiserEventsApi;
const __filename = log.getFilename(import.meta.url);

export class Serialiser {
	events: DoxEvents<eventsApi>;
	options: config.doxOptions;
	constructor(options: config.doxOptions) {
		log.info(log.identifier(this), 'Serialiser is listening', '\n');
		this.options = options;

		this.events = new DoxEvents(serialiserEventsApi, mainEventsApi);
		this.events.once('main.built.project', (project) => {
			serialiseMainMenu(project, this.events);
		});
	}
}

function serialiseMainMenu(project: DoxProject, events: DoxEvents<eventsApi>) {
	const serialised = serialiseDoxProject(project);
	events.emit('serialiser.mainMenu.serialised', serialised);
}
