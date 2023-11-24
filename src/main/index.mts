import 'source-map-support/register.js';
import { log } from '@typedox/logger';
import { config, DoxProject, DoxEvents } from '@typedox/core';
import { FileManager } from '@typedox/filemanager';
import { Serialiser } from '@typedox/serialiser';
import { mainEventsApi } from 'typedox/events';
import { copyAssetsToDocs } from './bff.mjs';

const __filename = log.getFilename(import.meta.url);
const events = new DoxEvents<mainEventsApi>(mainEventsApi);
let isDone = false;

export default function main(customOptions?: config.options<any>) {
	const projectConfig = new config.DoxConfig(customOptions);
	const { options } = projectConfig;

	events.emit('main.made.options', options);
	config.deepFreeze(options);
	events.emit('main.froze.options', options);
	log.info(log.identifier(__filename), options);

	if (!log.isLogLevelSet) log.setLogLevel(options.logLevel);
	new Serialiser(projectConfig.options);
	new FileManager(projectConfig.options);
	const doxProject = new DoxProject(projectConfig);

	events.emit('main.built.project', doxProject);

	copyAssetsToDocs(options.doxOut, 'packages/frontend');
}

export function logApplicationHelp() {
	const args = new config.CoreArgsApi();
	Object.keys(args).map((k) => {
		const key = k as keyof typeof args;
		const helpItem = args[key];

		log.group(config.argHyphen + log.colourise('Underscore', String(key)));
		log.log(helpItem.description);
		log.log('Default value:', helpItem.defaultValue);
		log.log();
		log.groupEnd();
	});
	return true;
}
export const isRequestForHelp = (argv = process.argv) =>
	argv.includes(`${config.argHyphen}help`);
