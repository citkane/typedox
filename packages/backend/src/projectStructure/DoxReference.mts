import ts from 'typescript';
import {
	DoxBranch,
	DoxDeclaration,
	DoxPackage,
	DoxSourceFile,
	TsWrapper,
	serialiser,
	tsItem,
	tsc,
} from '../typedox.mjs';
import { Dox } from './Dox.mjs';
import { log } from 'typedox/logger';

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
	public treeBranches: Map<string, DoxBranch> = new Map();
	public entryFileList: string[];
	public checker: ts.TypeChecker;
	public program: ts.Program;
	private ignoredFiles = [] as string[];
	private rootDeclarations?: DoxDeclaration[];

	private parent: DoxPackage;
	constructor(
		parent: DoxPackage,
		name: string,
		program: ts.Program,
		files: string[],
	) {
		super();
		//this.filesMap = parent.filesMap;
		this.checker = program.getTypeChecker();
		this.name = name;
		this.parent = parent;
		this.entryFileList = files;
		this.program = program;
	}

	public get toObject() {
		return serialiser.serialiseDoxReference(this);
	}
	public get doxPackage() {
		return this.parent;
	}
	public get doxProject() {
		return this.parent.doxProject;
	}

	public tsWrap = (item: tsItem): TsWrapper | undefined => {
		const wrapped = tsc.wrap(this.checker, this.program, item);
		if (!wrapped) notices.noWrap(item);
		return wrapped;
	};
	public discoverFiles(fileList = this.entryFileList) {
		fileList.forEach((fileName) => {
			if (
				this.filesMap.has(fileName) ||
				this.ignoredFiles.includes(fileName)
			)
				return;

			const fileSource = this.program.getSourceFile(fileName);
			if (!fileSource) {
				this.ignoredFiles.push(fileName);
				return notices.discoverFiles.fileSourceError(fileName);
			}

			const fileSymbol = this.checker.getSymbolAtLocation(fileSource);
			if (!fileSymbol) {
				this.ignoredFiles.push(fileName);
				return notices.discoverFiles.fileSymbolWarning(
					fileName,
					'No ts.Symbol for a ts.SourceFile.',
				);
			}

			const doxSourceFile = new DoxSourceFile(
				this,
				fileSource,
				fileSymbol,
			);
			this.filesMap.set(fileName, doxSourceFile);

			this.discoverFiles(doxSourceFile.childFiles);
		});
	}
	public discoverDeclarations = () => {
		this.filesMap.forEach((file) => file.discoverDeclarations());
	};

	public buildRelationships = () => {
		this.filesMap.forEach((file) => file.buildRelationships());
	};

	public getRootDeclarations = () => {
		if (this.rootDeclarations) return this.rootDeclarations;
		this.rootDeclarations = [];
		this.emit('declarations.findRootDeclarations', this.rootDeclarations);
		return this.rootDeclarations;
	};
}
const notices = {
	discoverFiles: {
		fileSourceError: (fileName: string) =>
			log.error(
				log.identifier(__filename),
				'No source file was found for:',
				fileName,
			),
		fileSymbolWarning: (fileName: string, message: string) =>
			log.warn(
				log.identifier(__filename),
				message,
				'File was not included as part of the documentation set:',
				fileName,
			),
	},
	noWrap: (item: tsItem) => {
		const message = Dox.isSymbol(item) ? item.name : item.getText();
		log.error(
			log.identifier(__filename),
			'Could not wrap a item:',
			message,
		);
	},
};
const seenFileError: string[] = [];
