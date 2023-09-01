import * as dox from '../typedox';

export class DoxProject extends dox.lib.Logger {
	public npmPackages: Map<string, dox.NpmPackage> = new Map();
	public doxOptions: dox.doxOptions;
	constructor(doxOptions: dox.doxOptions) {
		super();
		this.doxOptions = doxOptions;
	}
	public get toObject() {
		return dox.lib.serialiseProject(this);
	}
	public registerNpmPackage = (npmPackage: dox.NpmPackage) => {
		this.npmPackages.set(npmPackage.name, npmPackage);
	};
	public makeNpmPackage = (packageConfig: dox.config.PackageConfig) => {
		return new dox.NpmPackage(packageConfig, this);
	};
}
