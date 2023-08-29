import * as dox from '../typedox';
import * as ts from 'typescript';
const { Logger } = dox.lib;

export default class Package extends Logger {
	version: string;
	name: string;
	packageRoot: string;
	references: Map<string, dox.Reference> = new Map();
	doxConfig: dox.Config;

	constructor(config: dox.Config) {
		super();
		Package.class.bind(this);
		this.doxConfig = config;
		const { projectName, projectVersion, projectRoot } = config;
		this.version = projectVersion;
		this.name = projectName;
		this.packageRoot = projectRoot;
	}
	public makeContext = (
		name: string,
		program: ts.Program,
		config: ts.ParsedCommandLine,
	) => {
		const checker = program.getTypeChecker();
		const id = new dox.lib.Id();
		const context = new dox.lib.Context(
			checker,
			program,
			config,
			id,
			this,
			undefined as unknown as dox.Reference,
		);

		return context;
	};
}
