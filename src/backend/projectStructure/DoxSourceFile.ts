import * as ts from 'typescript';

import {
	DoxConfig,
	DoxDeclaration,
	DoxReference,
	declarationsMap,
	logger as log,
} from '../typedox';

/**
 * A container for typescript compiler source files:
 *
 * &emsp;DoxProject\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- DoxPackage[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- DoxReference[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- **TsSourceFile**[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- DoxDeclaration[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- Branch[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...DoxDeclaration...
 */
export class DoxSourceFile extends DoxConfig {
	public parent: DoxReference;
	public childFiles: string[];
	public fileName: string;
	public fileSymbol: ts.Symbol;
	public fileType: ts.Type;
	public declarationsMap: declarationsMap = new Map();
	public sourceFile: ts.SourceFile;
	public checker: ts.TypeChecker;
	public tsWrap: DoxReference['tsWrap'];

	constructor(
		parent: DoxReference,
		sourceFile: ts.SourceFile,
		fileSymbol: ts.Symbol,
	) {
		super();
		this.parent = parent;
		this.checker = parent.checker;
		this.tsWrap = parent.tsWrap;
		this.sourceFile = sourceFile;
		this.fileName = sourceFile.fileName;
		this.fileSymbol = fileSymbol;
		this.fileType = this.checker.getTypeOfSymbol(this.fileSymbol);
		this.childFiles = this.discoverChildFiles();

		log.debug(log.identifier(this), this.fileName);
	}

	public discoverDeclarations = () => {
		this.fileSymbol.exports?.forEach(this.makeDeclaration);
	};
	public makeDeclaration = (item: ts.Symbol) => {
		if (this.declarationsMap.has(item.name)) return;

		const declaration = new DoxDeclaration(
			this,
			this.tsWrap(item).tsSymbol,
		);

		this.declarationsMap.set(declaration.name, declaration);

		return declaration;
	};

	public buildRelationships = () => {
		this.declarationsMap.forEach((declaration) => {
			const { relate: mapRelationships, wrappedItem } = declaration;
			mapRelationships(wrappedItem);
		});
	};

	private juiceSymbol(symbol: ts.Symbol) {
		const { valueDeclaration } = symbol;
		let imports: any[] = (valueDeclaration as any)?.imports || [];

		imports = imports.reduce((accumulator, node: ts.Node) => {
			let symbol = this.checker.getSymbolAtLocation(node);
			if (symbol) accumulator.push(symbol);
			return accumulator;
		}, [] as ts.Symbol[]);

		const exports = Array.from(symbol.exports?.values() || []);

		const fileSymbols = [...imports, ...exports] as ts.Symbol[];

		return fileSymbols;
	}
	private discoverChildFiles = (
		fileSymbols = this.juiceSymbol(this.fileSymbol),
		accumulator = [] as string[],
	) => {
		return fileSymbols
			.reduce((accumulator, symbol) => {
				const wrap = this.tsWrap(symbol);
				const { targetFileName, fileName } = wrap;
				const file = targetFileName || fileName;
				file && file !== this.fileName && accumulator.push(file);
				return accumulator;
			}, accumulator)
			.filter((value, i, array) => array.indexOf(value) === i);
	};
}
const seenInvalids: string[] = [];
const notices = {
	invalidSpec(this: DoxSourceFile, node: ts.Node) {
		const name = node.getText().replace(/^"(.*)"$/, '$1');
		const fileName = node.getSourceFile().fileName;
		const id = name + fileName;
		if (seenInvalids.includes(id)) return;
		log.warn(
			log.identifier(this),
			`Invalid module specification "${name}" in:`,
			fileName,
		);
		seenInvalids.push(id);
	},
};
