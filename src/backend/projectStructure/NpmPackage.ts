import * as dox from '../typedox';
import * as ts from 'typescript';
const { Logger } = dox.lib;

export class NpmPackage extends Logger {
	parent: dox.DoxProject;
	tsReferences: Map<string, dox.TsReference> = new Map();
	packageConfig: dox.config.PackageConfig;

	version: string;
	name: string;

	constructor(
		projectConfig: dox.config.PackageConfig,
		parent: dox.DoxProject,
	) {
		super();
		this.parent = parent;
		this.packageConfig = projectConfig;
		NpmPackage.classString.bind(this);

		const {
			npmPackageName: projectName,
			npmPackageVersion: projectVersion,
			tsPrograms: programs,
		} = projectConfig;
		this.version = projectVersion;
		this.name = projectName;
	}
	public get toObject() {
		return dox.lib.serialiseNpmPackage(this);
	}
	public registerTsReference(tsReference: dox.TsReference) {
		this.tsReferences.set(tsReference.name, tsReference);
	}
	public static makeTsReferences(npmPackage: NpmPackage) {
		const { packageConfig } = npmPackage;
		return [...npmPackage.packageConfig.tsPrograms].map((args) =>
			NpmPackage.makeTsReference(...args, npmPackage),
		);
	}
	public static makeTsReference(
		name: string,
		program: ts.Program,
		npmPackage: NpmPackage,
	) {
		const { packageConfig } = npmPackage;
		const config = packageConfig.tsReferenceConfigs.get(name)!;
		const context = new dox.lib.DoxContext(program, config, npmPackage);
		return new dox.TsReference(npmPackage, context, name);
	}
}
