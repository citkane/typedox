import { log, logLevels } from '@typedox/logger';
import { config, DoxProject, DoxEvents } from '@typedox/core';
import { FileManager } from '@typedox/filemanager';
import { Serialiser } from '@typedox/serialiser';
import { mainEventsApi } from 'typedox/events';

const __filename = log.getFilename(import.meta.url);
const events = new DoxEvents<mainEventsApi>(mainEventsApi);
let isDone = false;

export default function main(customOptions?: config.doxOptions) {
	const projectOptions = config.getDoxOptions(customOptions);
	events.emit('main.made.options', projectOptions, done);

	config.deepFreeze(projectOptions);
	events.emit('main.froze.options', projectOptions);

	if (isDone) return;

	if (!log.isLogLevelSet) log.setLogLevel(logLevels[projectOptions.logLevel]);
	new Serialiser(projectOptions);
	new FileManager(projectOptions);
	const doxProject = new DoxProject(projectOptions);

	events.emit('main.built.project', doxProject!, done);
	if (isDone) return;
}

export type done = typeof done;
export const cancel = {
	isDone: false,
	done,
};
function done(value?: any) {
	isDone = true;
	cancel.isDone = true;
	events.emit('main.done', value);
}

export function logApplicationHelp() {
	Object.keys(config.doxArgs).map((k) => {
		const key = k as keyof config.doxArgs;
		const helpItem = config.doxArgs[key];

		log.group(config.argHyphen + log.colourise('Underscore', key));
		log.log(helpItem.description);
		log.log('Default value:', helpItem.defaultValue);
		log.log();
		log.groupEnd();
	});
	return true;
}
export const isRequestForHelp = (argv = process.argv) =>
	argv.includes(`${config.argHyphen}help`);
