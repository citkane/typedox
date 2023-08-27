import * as dox from '../typedox';
import * as ts from 'typescript';
const { Logger } = dox.lib;

export default class Package extends Logger {
	version: string;
	name: string;
	references: Map<string, dox.Reference> = new Map();
	constructor(name: string, version: string) {
		super();
		Package.class.bind(this);
		this.version = version;
		this.name = name;
	}
	public makeReference = (config: ts.ParsedCommandLine, name: string) => {
		config.options.types = [];

		const program = ts.createProgram(config.fileNames, config.options);
		const diagnostics = ts.getPreEmitDiagnostics(program);

		if (diagnostics.length) {
			diagnostics.forEach((diagnosis) => {
				this.warn(this.class, diagnosis.messageText);
				this.debug(diagnosis.relatedInformation);
			});
			this.throwError(this.class, 'TSC diagnostics failed.');
		}

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
		this.references.set(
			name,
			new dox.Reference(context, name, config.fileNames),
		);
	};
}
