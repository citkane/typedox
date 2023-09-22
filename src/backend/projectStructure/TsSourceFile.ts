import * as ts from 'typescript';
import {
	DoxConfig,
	Relation,
	TsDeclaration,
	TsReference,
	declarationMap,
	logger as log,
	tsc,
} from '../typedox';

/**
 * A container for typescript compiler source files:
 *
 * &emsp;DoxProject\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- NpmPackage[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- TsReference[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- **TsSourceFile**[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- TsDeclaration[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- Branch[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...TsDeclaration...
 */
export class TsSourceFile extends DoxConfig {
	public parent: TsReference;
	public childFiles: string[];
	public fileName: string;
	public fileSymbol: ts.Symbol;
	public fileType: ts.Type;
	public declarationsMap: declarationMap = new Map();
	public source: ts.SourceFile;

	constructor(
		parent: TsReference,
		source: ts.SourceFile,
		fileSymbol: ts.Symbol,
	) {
		super(parent.checker);
		this.parent = parent;
		this.checker = this.checker!;
		this.source = source;
		this.fileName = source.fileName;
		this.fileSymbol = fileSymbol;
		this.fileType = this.checker.getTypeOfSymbol(this.fileSymbol);
		this.childFiles = this.discoverFiles(this.fileExportsArray);

		log.debug(log.identifier(this), this.fileName);
	}
	public getModuleDeclarationSymbols = () => {
		return this.fileExportsArray
			.filter(
				(symbol) =>
					symbol.valueDeclaration &&
					ts.isModuleDeclaration(symbol.valueDeclaration),
			)
			.map((symbol) => {
				const body = (symbol.valueDeclaration as ts.ModuleDeclaration)
					?.body! as any;
				return (body.statements as ts.ExpressionStatement[]).map(
					(statement) => {
						return statement.expression.getText();
					},
				);
			})
			.flat()
			.map((name) => {
				return (this.source as any).locals.get(name)! as ts.Symbol;
			})
			.filter((val) => !!val);
	};
	private getModuleDeclarationImports = () => {
		return this.getModuleDeclarationSymbols().reduce(
			(accumulator, symbol) => {
				const value = this.tsWrap(symbol).tsNode;
				const isImport =
					ts.isImportClause(value) ||
					ts.isImportDeclaration(value) ||
					ts.isImportSpecifier(value);
				isImport && accumulator.push(symbol);

				return accumulator;
			},
			[] as ts.Symbol[],
		);
	};
	private get fileExportsArray() {
		const exports = this.fileSymbol.exports?.values();
		return Array.from(exports || []);
	}
	private discoverFiles = (fileSymbols: ts.Symbol[]) => {
		const allFileSymbols = [
			...this.getModuleDeclarationImports(),
			...fileSymbols,
		].filter((symbol, i, array) => array[i].name === symbol.name);

		return allFileSymbols
			.map(getFileNames.bind(this))
			.flat()
			.filter(filter) as string[];

		function getFileNames(this: TsSourceFile, symbol: ts.Symbol) {
			return tsc.isReExport(symbol)
				? discoverStars.bind(this)(symbol)
				: this.tsWrap(symbol).targetFileName!;
		}
		function discoverStars(this: TsSourceFile, symbol: ts.Symbol) {
			return tsc.parseReExport
				.call(this, symbol)
				.map((expression) => this.tsWrap(expression).targetFileName!);
		}
		function filter(value: string, index: number, array: string[]) {
			return !!value && array.indexOf(value) === index;
		}
	};
	public discoverDeclarations = () => {
		this.fileSymbol.exports?.forEach(parseSymbol.bind(this));

		function parseSymbol(this: TsSourceFile, symbol: ts.Symbol) {
			tsc.isReExport(symbol)
				? discoverStarExports.bind(this)(symbol)
				: makeDeclaration.call(this, symbol);
		}
		function discoverStarExports(this: TsSourceFile, symbol: ts.Symbol) {
			tsc.parseReExport
				.call(this, symbol)
				.forEach(makeDeclaration.bind(this));
		}
		function makeDeclaration(
			this: TsSourceFile,
			item: ts.Symbol | ts.Node,
		) {
			const declaration = new TsDeclaration(this, item);
			this.declarationsMap.set(declaration.name, declaration);
		}
	};
	public buildRelationships = () => {
		this.declarationsMap.forEach(
			(declaration) => new Relation(this, declaration),
		);
	};
}
