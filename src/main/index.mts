import 'source-map-support/register.js';
import { log, loggerUtils } from '@typedox/logger';
import { config, DoxProject, DoxEvents } from '@typedox/core';
import { FileManager } from '@typedox/filemanager';
import { Serialiser } from '@typedox/serialiser';
import { mainEventsApi } from 'typedox/events';
import { copyAssetsToDocs } from './bff.mjs';

const __filename = log.getFilename(import.meta.url);
const events = new DoxEvents<mainEventsApi>(mainEventsApi);

export default function main(customOptions?: config.options<any>) {
	if (bootApplicationHelp()) return;
	((projectConfig) => {
		bootListeners(projectConfig);
		bootProject(projectConfig);
		bootAssets(projectConfig);
	})(bootConfig(customOptions));
}

function bootConfig(customOptions?: config.options<any>) {
	return ((projectConfig) => {
		events.emit('main.made.options', projectConfig.options);
		config.deepFreeze(projectConfig);
		events.emit('main.froze.options', projectConfig.options);
		if (!log.isLogLevelSet) log.setLogLevel(projectConfig.options.logLevel);

		return projectConfig;
	})(new config.DoxConfig(customOptions));
}
function bootListeners({ options }: config.DoxConfig) {
	new Serialiser(options);
	new FileManager(options);
}
function bootProject(projectConfig: config.DoxConfig) {
	((doxProject) => {
		events.emit('main.built.project', doxProject);
	})(new DoxProject(projectConfig));
}
function bootAssets({ options }: config.DoxConfig) {
	copyAssetsToDocs(options.doxOut, 'packages/frontend');
}

function bootApplicationHelp() {
	return ((isRequested) => {
		return isRequested
			? ((args) => {
					loggerUtils.logHelp(args as any, config.argHyphen);
					return true;
			  })(new config.CoreArgsApi())
			: false;
	})(process.argv.includes(`${config.argHyphen}help`));
}
