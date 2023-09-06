import * as fs from 'fs';
import { logger as log, config } from '../typedox';

export function auditOptions(this: config.ProjectConfig) {
	logLevel.call(this);
	projectRootDir.call(this);
	tsConfigs.call(this);
}
function logLevel(this: config.ProjectConfig) {
	!log.logLevels[this.projectConfig.logLevel] &&
		log.warn(
			log.identifier(this),
			`Invalid loglevel value. Must be one of [${log.logLevelKeyStrings}]. Got:`,
			this.projectConfig.logLevel,
		);
}
function projectRootDir(this: config.ProjectConfig) {
	!fs.existsSync(this.projectRootDir) &&
		log.throwError(
			log.identifier(this),
			'Root directory does not exist:',
			this,
			this.projectRootDir,
		);
}
function tsConfigs(this: config.ProjectConfig) {
	if (!this.tsConfigs.length)
		log.throwError(
			`Could not find any ${config.tsFileSpecifier}.json entry points.`,
		);
	this.tsConfigs.forEach((configPath) => {
		!fs.existsSync(configPath) &&
			log.throwError(
				log.identifier(this),
				'Package directory was not found:',
				configPath,
			);
	});
}
