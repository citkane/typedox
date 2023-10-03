import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import {
	Branch,
	DoxConfig,
	NpmPackage,
	TsSourceFile,
	TscWrapper,
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
 * &emsp;&emsp;--- NpmPackage[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- **TsReference**[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- TsSourceFile[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- TsDeclaration[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- Branch[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...TsDeclaration...
 *
 */
export class TsReference extends DoxConfig {
	public name: string;
	public parent: NpmPackage;
	public filesMap = new Map<string, TsSourceFile>();
	public treeBranches: Map<string, Branch> = new Map();
	public entryFileList: string[];
	public checker: ts.TypeChecker;
	private program: ts.Program;

	constructor(
		parent: NpmPackage,
		name: string,
		program: ts.Program,
		files: string[],
	) {
		super();
		this.checker = program.getTypeChecker();
		this.name = name;
		this.parent = parent;
		this.entryFileList = files;
		this.program = program;
	}

	public get toObject() {
		return serialise.serialiseTsReference(this);
	}
	public tsWrap = (item: tsItem): TscWrapper => {
		return tsc.wrap(this.checker, item);
	};
	public discoverFiles(fileList = this.entryFileList) {
		fileList.forEach((fileName) => {
			if (this.filesMap.has(fileName)) return;

			const fileSource = this.program.getSourceFile(fileName);
			if (!fileSource)
				return notices.discoverFiles.fileSourceError(fileName);

			const fileSymbol = this.checker!.getSymbolAtLocation(fileSource);
			if (!fileSymbol)
				return notices.discoverFiles.fileSymbolWarning(fileName);

			const doxSourceFile = new TsSourceFile(
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
	public validateSpecifier(item: ts.Symbol | ts.Node) {
		const isNode = item.constructor.name === 'NodeObject';
		if (!isNode) return true;
		item = item as ts.Node;
		const isImportExport =
			ts.isExportDeclaration(item.parent) ||
			ts.isImportDeclaration(item.parent);
		if (isImportExport) {
			const exists = ts.isImportClause(item)
				? !!this.checker.getTypeAtLocation(item)?.symbol
				: ts.isNamespaceExport(item)
				? !!fs.existsSync(this.tsWrap(item).targetFileName!)
				: !!this.checker.getSymbolAtLocation(item);
			!exists && notices.noFileWarning(this, item);
			return exists;
		}

		return true;
	}
}
const notices = {
	discoverFiles: {
		fileSourceError: (fileName: string) =>
			log.error(
				log.identifier(__filename),
				'No source file was found:',
				fileName,
			),
		fileSymbolWarning: (fileName: string) =>
			log.warn(
				log.identifier(__filename),
				'File was not included as part of the documentation set:',
				fileName,
			),
	},
	noFileWarning: (location: any, item: ts.Node) => {
		const dir = path.dirname(item.getSourceFile().fileName);
		const file = item.getText().replace(/"/g, '');
		const filePath = path.join(dir, file);
		const id = log.identifier(location) + filePath;
		if (!seenFileError.includes(id)) {
			log.warn(
				log.identifier(location),
				'File does not exist:',
				filePath,
			);
		}
		seenFileError.push(id);
	},
};
const seenFileError: string[] = [];
