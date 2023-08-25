import * as dox from '../typedox';
import * as ts from 'typescript';

export default class SourceFile extends dox.lib.Dox {
	private relationshipTriggers: (() => void)[] = [];
	public childFiles: string[] = [];
	public kind = dox.Kind.SourceFile;
	public fileName: string;
	public fileSymbol?: ts.Symbol;
	public fileType!: ts.Type;
	public declarationsMap: dox.declarationMap = new Map();
	public source: ts.SourceFile;

	constructor(context: dox.lib.Context, source: ts.SourceFile) {
		super(context);
		this.context = { ...this.context, sourceFile: this };
		const { checker } = this.context;

		this.source = source;
		this.fileName = source.fileName;
		this.fileSymbol = checker.getSymbolAtLocation(source);

		if (!this.fileSymbol) return;

		this.fileType = checker.getTypeOfSymbol(this.fileSymbol);
		this.fileType.getProperties()?.forEach(this.registerDoxDeclarations);
		this.fileSymbol.exports?.forEach((exported) => {
			this.mergeNewFiles(exported);
			this.mergeTriggers(exported);
		});
	}

	public triggerRelationships = () => {
		this.relationshipTriggers.forEach((trigger) => trigger());
	};

	private registerDoxDeclarations = (symbol: ts.Symbol) => {
		const declaration = new dox.Declaration(this.context, symbol);
		this.declarationsMap.set(declaration.name, declaration);
	};
	private mergeNewFiles = (symbol: ts.Symbol) => {
		const files = new dox.relationships.FileFinder(this.context, symbol);
		this.childFiles = [...this.childFiles, ...files.childFiles];
	};
	private mergeTriggers = (symbol: ts.Symbol) => {
		const triggers = new dox.relationships.RelationshipTriggers(
			this.context,
			symbol,
		);
		this.relationshipTriggers = [
			...this.relationshipTriggers,
			...triggers.relationshipTriggers,
		];
	};
	public static getModuleSpecifier = (
		node: ts.Node,
	): ts.Expression | undefined => {
		if ('moduleSpecifier' in node)
			return node.moduleSpecifier as ts.Expression;
		if (!!node.parent) return this.getModuleSpecifier(node.parent);
		return undefined;
	};
	public static getFilenameFromType(type: ts.Type) {
		return type.getSymbol()?.valueDeclaration?.getSourceFile().fileName;
	}

	public static getLocalTargetSymbol(
		checker: ts.TypeChecker,
		declaration: ts.ExportSpecifier,
	) {
		const declarations = checker
			.getExportSpecifierLocalTargetSymbol(declaration)
			?.getDeclarations();

		return declarations && declarations.length > 1
			? (dox.log.warn(
					'Expected only one declaration in a local target symbol',
			  ) as undefined)
			: declarations
			? declarations[0]
			: undefined;

		/*
			.find((declaration) => {
				dox.log.kind(declaration);
				return [
					ts.SyntaxKind.NamespaceExport,
					ts.SyntaxKind.ModuleDeclaration,
					ts.SyntaxKind.Declar,
				].includes(declaration.kind);
			}) as
			| ts.NamespaceImport
			| ts.ModuleDeclaration
			| ts.ExportDeclaration
			| undefined;
			*/
	}
}
