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
		checker: ts.TypeChecker,
	) {
		super(parent.projectOptions, checker);
		this.parent = parent;
		this.checker = this.checker!;

		this.source = source;
		this.fileName = source.fileName;
		this.fileSymbol = this.checker.getSymbolAtLocation(source)!;
		this.fileType = this.checker.getTypeOfSymbol(this.fileSymbol);
		const fileExports = this.fileSymbol.exports?.values();
		this.childFiles = this.discoverFiles([...(fileExports || [])]);

		log.debug(log.identifier(this), this.fileName);
	}

	private discoverFiles = (fileSymbols: ts.Symbol[]) => {
		return fileSymbols.map(getFileNames.bind(this)).flat().filter(filter);

		function getFileNames(this: TsSourceFile, symbol: ts.Symbol) {
			return tsc.isStarExport(symbol)
				? discoverStars.bind(this)(symbol)
				: this.tsWrap(symbol).targetFileName!;
		}
		function discoverStars(this: TsSourceFile, symbol: ts.Symbol) {
			return tsc.parseExportStars
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
			tsc.isStarExport(symbol)
				? discoverStarExports.bind(this)(symbol)
				: makeDeclaration.call(this, symbol);
		}
		function discoverStarExports(this: TsSourceFile, symbol: ts.Symbol) {
			tsc.parseExportStars
				.call(this, symbol)
				.forEach(makeDeclaration.bind(this));
		}
		function makeDeclaration(
			this: TsSourceFile,
			item: ts.Symbol | ts.Node,
		) {
			const declaration = new TsDeclaration(this, item, this.checker!);
			this.declarationsMap.set(declaration.name, declaration);
		}
	};
	public buildRelationships = () => {
		this.declarationsMap.forEach(
			(declaration) => new Relation(this, declaration, this.checker!),
		);
	};
}
