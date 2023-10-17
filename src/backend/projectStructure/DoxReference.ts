import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import {
	Branch,
	DoxConfig,
	DoxPackage,
	DoxSourceFile,
	TsWrapper,
	logger as log,
	serialise,
	tsItem,
	tsc,
} from '../typedox';

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
export class DoxReference extends DoxConfig {
	public name: string;
	public parent: DoxPackage;
	public filesMap = new Map<string, DoxSourceFile>();
	public treeBranches: Map<string, Branch> = new Map();
	public entryFileList: string[];
	public checker: ts.TypeChecker;
	public program: ts.Program;
	private ignoredFiles = [] as string[];

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
		return serialise.serialiseDoxReference(this);
	}
	public tsWrap = (item: tsItem): TsWrapper => {
		return tsc.wrap(this.checker, item);
	};
	public discoverFiles(fileList = this.entryFileList) {
		fileList.forEach((fileName) => {
			if (
				this.filesMap.has(fileName) ||
				this.ignoredFiles.includes(fileName)
			) {
				return;
			}

			if (fileName.startsWith(tsc.badFilePrefix)) {
				this.ignoredFiles.push(fileName);
				return notices.discoverFiles.fileSourceError(
					fileName.replace(tsc.badFilePrefix, ''),
				);
			}
			const fileSource = this.program.getSourceFile(fileName);

			if (!fileSource)
				return notices.discoverFiles.fileSourceError(fileName);

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
		return Array.from(this.filesMap.values())
			.map((fileSource) =>
				Array.from(fileSource.declarationsMap.values()),
			)
			.flat()
			.filter((declaration) => !declaration.parents.size);
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
};
const seenFileError: string[] = [];
