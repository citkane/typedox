import { Dox } from '../lib/Dox';
import * as dox from '../typedox';
import * as ts from 'typescript';

export default class SourceFile extends Dox {
	public childFiles: string[];
	public fileName: string;
	public fileSymbol: ts.Symbol;
	public fileType!: ts.Type;
	public declarationsMap: dox.declarationMap = new Map();
	public source: ts.SourceFile;

	constructor(context: dox.lib.Context, source: ts.SourceFile) {
		super(context);
		SourceFile.class.bind(this);
		this.context = { ...this.context, sourceFile: this };

		this.source = source;
		this.fileName = source.fileName;

		this.fileSymbol = this.checker.getSymbolAtLocation(source)!;
		const fileExports = this.fileSymbol.exports?.values();
		this.childFiles = this.discoverFiles([...(fileExports || [])]);

		this.debug(this.class, this.fileName);
	}
	private discoverFiles = (fileSymbols: ts.Symbol[]) => {
		return fileSymbols
			.map((symbol) =>
				symbol.flags === ts.SymbolFlags.ExportStar
					? this.parseExportStars(symbol).map(
							(expression) =>
								this.getter(expression).targetFileName!,
					  )
					: this.getter(symbol).targetFileName!,
			)
			.flat()
			.filter(
				(value, index, array) =>
					!!value && array.indexOf(value) === index,
			);
	};
	public discoverDeclarations = () => {
		this.fileType = this.checker.getTypeOfSymbol(this.fileSymbol);
		this.fileType.getProperties()?.forEach((symbol) => {
			const declaration = new dox.Declaration(this.context, symbol);
			this.declarationsMap.set(declaration.name, declaration);
		});
	};
	public discoverRelationships = () =>
		this.fileSymbol.exports?.forEach((symbol) => {
			symbol.flags === ts.SymbolFlags.ExportStar
				? this.parseExportStars(symbol).forEach((expression) => {
						return;
						new dox.lib.Relationships(
							this.context,
							this.checker.getSymbolAtLocation(expression)!,
						);
				  })
				: new dox.lib.Relationships(this.context, symbol);
		});

	private parseExportStars(symbol: ts.Symbol) {
		return symbol
			.declarations!.map((declaration) => {
				return ts.isExportDeclaration(declaration)
					? declaration.moduleSpecifier!
					: logError(this, declaration);
			})
			.filter((symbol) => !!symbol) as ts.Expression[];

		function logError(self: SourceFile, declaration: ts.Declaration) {
			self.error(
				self.class,
				`Expected a ts.ExportDeclaration but got ts.${
					ts.SyntaxKind[declaration.kind]
				}`,
			);
		}
	}
}
