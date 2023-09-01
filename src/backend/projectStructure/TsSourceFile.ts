import * as dox from '../typedox';
import * as ts from 'typescript';
import { Dox } from './Dox';

export class TsSourceFile extends Dox {
	public childFiles: string[];
	public fileName: string;
	public fileSymbol: ts.Symbol;
	public fileType: ts.Type;
	public declarationsMap: dox.declarationMap = new Map();
	public source: ts.SourceFile;

	constructor(context: dox.lib.DoxContext, source: ts.SourceFile) {
		super(context);
		TsSourceFile.classString.bind(this);
		this.context = { ...this.context, tsSourceFile: this };

		this.source = source;
		this.fileName = source.fileName;
		this.fileSymbol = this.checker.getSymbolAtLocation(source)!;
		this.fileType = this.checker.getTypeOfSymbol(this.fileSymbol);
		const fileExports = this.fileSymbol.exports?.values();
		this.childFiles = this.discoverFiles([...(fileExports || [])]);

		this.debug(this.classIdentifier, this.fileName);
	}
	public get parent() {
		return this.reference!;
	}
	private discoverFiles = (fileSymbols: ts.Symbol[]) => {
		return fileSymbols.map(getFileNames.bind(this)).flat().filter(filter);

		function getFileNames(this: TsSourceFile, symbol: ts.Symbol) {
			return dox.isStarExport(symbol)
				? discoverStars.bind(this)(symbol)
				: this.tsWrap(symbol).targetFileName!;
		}
		function discoverStars(this: TsSourceFile, symbol: ts.Symbol) {
			return dox.parseExportStars
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
			dox.isStarExport(symbol)
				? discoverStarExports.bind(this)(symbol)
				: makeDeclaration.call(this, symbol);
		}
		function discoverStarExports(this: TsSourceFile, symbol: ts.Symbol) {
			dox.parseExportStars
				.call(this, symbol)
				.forEach(makeDeclaration.bind(this));
		}
		function makeDeclaration(
			this: TsSourceFile,
			item: ts.Symbol | ts.Node,
		) {
			const declaration = new dox.TsDeclaration(this.context, item);
			this.declarationsMap.set(declaration.name, declaration);
		}
	};
	public buildRelationships = () => {
		this.declarationsMap.forEach(
			(declaration) => new dox.lib.Relation(this.context, declaration),
		);
	};
}
