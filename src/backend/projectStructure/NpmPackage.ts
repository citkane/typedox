import * as dox from '../typedox';
import * as ts from 'typescript';

const log = dox.logger;

/**
 * A container for all npm `package` declarations. Can be one, or many in a monorepo:
 *
 * &emsp;DoxProject\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- **NpmPackage**[]\
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
 *
 *
 */
export class NpmPackage {
	parent: dox.DoxProject;
	tsReferences: Map<string, dox.TsReference> = new Map();
	packageConfig: dox.config.PackageConfig;

	version: string;
	name: string;

	constructor(
		projectConfig: dox.config.PackageConfig,
		parent: dox.DoxProject,
	) {
		this.parent = parent;
		this.packageConfig = projectConfig;

		const {
			npmPackageName: projectName,
			npmPackageVersion: projectVersion,
			tscPrograms: programs,
		} = projectConfig;
		this.version = projectVersion;
		this.name = projectName;
	}
	public get toObject() {
		return dox.serialise.serialiseNpmPackage(this);
	}
	public registerTsReference(tsReference: dox.TsReference) {
		this.tsReferences.set(tsReference.name, tsReference);
	}
	public static makeTsReferences(npmPackage: NpmPackage) {
		const { packageConfig } = npmPackage;
		return [...npmPackage.packageConfig.tscPrograms].map((programs) =>
			NpmPackage.makeTsReference(...programs, npmPackage),
		);
	}
	public static makeTsReference(
		name: string,
		tsProgram: ts.Program,
		npmPackage: NpmPackage,
	) {
		const { packageConfig } = npmPackage;
		const tsConfig = packageConfig.tscConfigs.get(name)!;
		const context = new dox.DoxContext({ tsProgram, tsConfig, npmPackage });
		return new dox.TsReference(context, name);
	}
}
