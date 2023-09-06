import * as dox from '../typedox';
const log = dox.logger;

/**
 * A container for the whole project structure
 *
 * &emsp;**DoxProject**\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- NpmPackage[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- TsReference[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- TsSourceFile[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- TsDeclaration[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- Branch[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...TsDeclaration...
 */
export class DoxProject {
	public npmPackages: Map<string, dox.NpmPackage> = new Map();
	public projectConfig: dox.config.ProjectConfig;

	constructor(projectConfig: dox.config.ProjectConfig) {
		this.projectConfig = projectConfig;
	}
	public get toObject() {
		return dox.serialise.serialiseProject(this);
	}
	public registerNpmPackage = (npmPackage: dox.NpmPackage) => {
		this.npmPackages.set(npmPackage.name, npmPackage);
	};
	public makeNpmPackage = (packageConfig: dox.config.PackageConfig) => {
		return new dox.NpmPackage(packageConfig, this);
	};

	public static deepReport(
		this: dox.TsDeclaration | dox.Relation,
		logLevel: keyof typeof log.logLevels,
		message: string,
		get: dox.TscWrapper,
		isLocalTarget: boolean,
	) {
		log[logLevel](log.identifier(this), message, {
			filename: this.get.fileName,
			sourceReport: this.get.report,
			sourceDeclaration: this.get.nodeDeclarationText,
			targetReport: isLocalTarget ? get.report : undefined,
			targetDeclaration: isLocalTarget
				? get.nodeDeclarationText
				: undefined,
		});
	}
}
