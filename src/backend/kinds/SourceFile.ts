import * as dox from '../typedox';
import * as ts from 'typescript';

export default class SourceFile extends dox.lib.Dox {
	/**
	 * An array of callback functions to be triggered after all linked
	 * files of the package have been discovered.
	 */
	private relationshipTriggers: (() => void)[] = [];
	public childFiles: string[] = [];
	public kind = dox.Kind.SourceFile;
	public fileName: string;
	public fileSymbol: ts.Symbol;
	public fileType: ts.Type;
	public declarationsMap: dox.declarationMap = new Map();
	public source: ts.SourceFile;

	constructor(context: dox.lib.Context, source: ts.SourceFile) {
		super(context);
		const { checker } = this.context;
		context = { ...this.context, sourceFile: this };

		this.source = source;
		this.fileName = source.fileName;
		this.fileSymbol = checker.getSymbolAtLocation(source)!;
		this.fileType = checker.getTypeOfSymbol(this.fileSymbol);

		this.fileType.getProperties()?.forEach((symbol) => {
			const keyName = symbol.getName();
			const declaration = new dox.Declaration(context, symbol);
			this.declarationsMap.set(keyName, declaration);
		});
		this.fileSymbol.exports?.forEach((symbol) => {
			const triggers = new dox.lib.RelationshipTriggers(context, symbol);
			this.mergeNewTriggers(triggers.relationshipTriggers);
			this.mergeNewFiles(triggers.childFiles);
		});
	}
	public buildRelationships = () => {
		this.relationshipTriggers.forEach((trigger) => trigger());
	};
	private mergeNewTriggers(
		relationshipTriggers: typeof this.relationshipTriggers,
	) {
		this.relationshipTriggers = [
			...this.relationshipTriggers,
			...relationshipTriggers,
		];
	}
	private mergeNewFiles(childFiles: string[]) {
		this.childFiles = [...this.childFiles, ...childFiles];
	}
}
