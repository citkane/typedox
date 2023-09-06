import * as path from 'path';
import * as ts from 'typescript';
import { logger as log, tscRawConfig } from '../typedox';
import * as opts from './libOpts';
import * as api from './projectConfigApi';
import * as config from './libConfig';
import { PackageConfig } from './PackageConfig';

export class ProjectConfig {
	public npmPackages = new Map<string, PackageConfig>();
	protected projectConfig: opts.doxOptions<api.confApi>;
	protected tscCommandlineConfig: ts.ParsedCommandLine;
	protected clProject: string | undefined;
	protected entryConfig: string | undefined;

	constructor(
		projectConfig: opts.doxOptions<api.confApi>,
		tscCommandlineConfig: ts.ParsedCommandLine,
	) {
		this.projectConfig = projectConfig;
		this.tscCommandlineConfig = tscCommandlineConfig;

		this.clProject = this.tscCommandlineConfig.options.project;
		this.entryConfig = this.tsConfigs.length
			? undefined
			: ts.findConfigFile(this.projectRootDir, ts.sys.fileExists);
	}

	get projectRootDir() {
		return path.resolve(this.projectConfig.projectRootDir);
	}
	get doxOut() {
		return config.getDoxOut.call(this);
	}
	get dependTypes() {
		return this.projectConfig.typeDependencies;
	}
	get logLevel() {
		return log.logLevels[this.projectConfig.logLevel];
	}
	get tsConfigs() {
		return config.getTsConfigFilePaths.call(this);
	}
	get npmFileConvention() {
		return this.projectConfig.npmFileConvention;
	}
}
