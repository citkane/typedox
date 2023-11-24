import ts from 'typescript';
import { TsWrapper, tsItem, wrap } from '@typedox/wrapper';
import { log, loggerUtils } from '@typedox/logger';
import { CategoryKind, DoxPackage, DoxSourceFile, events } from './index.mjs';
import { Dox } from './Dox.mjs';

const __filename = log.getFilename(import.meta.url);

/**
 * A container for a typescript compiler reference. This could be the only one in a npm package, or one of many if
 * the typescript `references` option is used. Each reference will have a corresponding `tsconfig`.
 *
 * &emsp;DoxProject\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- DoxPackage[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- **DoxReference**[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- DoxSourceFile[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- DoxDeclaration[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- Branch[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...DoxDeclaration...
 *
 */
export class DoxReference extends Dox {
	public name: string;
	public filesMap = new Map<string, DoxSourceFile>();
	public checker: ts.TypeChecker;
	public program: ts.Program;
	public category = CategoryKind.Reference;

	private parent: DoxPackage;

	constructor(
		parent: DoxPackage,
		name: string,
		parsedConfig: ts.ParsedCommandLine,
		programsLen: number,
		index: number,
	) {
		super();

		this.name = name;
		this.parent = parent;
		this.program = makeProgramFromConfig(
			parsedConfig,
			name,
			programsLen,
			index,
		)!;
		this.checker = this.program && this.program.getTypeChecker();

		this.program?.getSourceFiles().forEach((sourceFile) => {
			if (
				this.program.isSourceFileFromExternalLibrary(sourceFile) ||
				sourceFile.isDeclarationFile
			) {
				return;
			}
			const doxSourceFile = new DoxSourceFile(this, sourceFile);
			if (doxSourceFile.error || doxSourceFile.json) return;
			this.filesMap.set(doxSourceFile.fileName, doxSourceFile);
		});

		events.emit('core.reference.declareReference', this);

		this.filesMap.forEach((doxFile) => doxFile.discoverDeclarations());
		this.filesMap.forEach((doxFile) => doxFile.buildRelationships());
		this.filesMap.forEach((doxFile) => {
			doxFile.declarationsMap.forEach((declaration) => {
				events.emit('core.declaration.related', declaration);
			});
		});
	}

	public get doxPackage() {
		return this.parent;
	}
	public get doxProject() {
		return this.parent.doxProject;
	}
	public get doxOptions() {
		return this.doxProject.options;
	}
	public tsWrap = (item: tsItem): TsWrapper => {
		const wrapped = wrap(this.checker, this.program, item);
		return wrapped;
	};
}

function makeProgramFromConfig(
	parsedConfig: ts.ParsedCommandLine,
	name: string,
	programsLen: number,
	index: number,
) {
	const { fileNames, options } = parsedConfig;
	const { configFilePath } = options;
	const program = ts.createProgram(fileNames, options);
	notices.logProgram(
		String(parsedConfig.options.configFilePath),
		name,
		index,
		programsLen,
	);
	return runDiagnostics(program, String(configFilePath))
		? program
		: undefined;

	function runDiagnostics(program: ts.Program, fileName: string) {
		const diagnostics = program.getGlobalDiagnostics();
		diagnostics.forEach((diagnostic) => {
			notices.diagnostics.warn(diagnostic.messageText.toString());
		});
		if (diagnostics.length) notices.diagnostics.error(fileName);
		return diagnostics.length ? false : true;
	}
}

const notices = {
	logProgram: (
		filePath: string,
		name: string,
		index: number,
		programsLen: number,
	) => {
		const memoryUsed = loggerUtils.formatBytes(process.memoryUsage().rss);
		log.info(
			log.identifier(__filename),
			`Creating tsc program ${
				Number(index) + 1
			} of ${programsLen} as ${name}:`,
			filePath,
			loggerUtils.colourise('FgGray', memoryUsed),
		);
	},
	diagnostics: {
		warn: (message: string) =>
			log.warn(log.identifier(__filename), message),
		error: (fileName: string) =>
			log.error(
				log.identifier(__filename),
				'Error in ts.Program:',
				String(fileName),
			),
	},
};
