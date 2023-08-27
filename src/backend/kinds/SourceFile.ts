import { Dox } from '../lib/Dox';
import * as dox from '../typedox';
import * as ts from 'typescript';

export default class SourceFile extends Dox {
	private relationshipTriggers: (() => void)[] = [];
	public childFiles: string[] = [];
	public fileName: string;
	public fileSymbol: ts.Symbol;
	public fileType!: ts.Type;
	public declarationsMap: dox.declarationMap = new Map();
	public source: ts.SourceFile;

	constructor(context: dox.lib.Context, source: ts.SourceFile) {
		super(context);
		//Dox.class.bind(this);
		//this.context = { ...this.context, sourceFile: this };

		this.source = source;
		this.fileName = source.fileName;
		this.fileSymbol = this.checker.getSymbolAtLocation(source)!;
		this.fileSymbol.exports?.forEach((symbol) => {
			let get = this.getter(symbol);
			const localTarget = get.localTargetDeclaration;
			if (localTarget) get = this.getter(localTarget);

			if (!get.moduleSpecifier) return;

			const moduleSymbol = this.checker.getSymbolAtLocation(
				get.moduleSpecifier,
			);
			const targetFile =
				moduleSymbol?.valueDeclaration?.getSourceFile().fileName;

			if (targetFile && !this.childFiles.includes(targetFile))
				this.childFiles.push(targetFile);
		});

		/*
		this.fileSymbol.exports?.forEach((exported) => {
			this.mergeNewFiles(exported);
			this.mergeTriggers(exported);
		});
		*/
	}
	public discoverDeclarations = () => {
		this.fileType = this.checker.getTypeOfSymbol(this.fileSymbol);
		this.fileType.getProperties()?.forEach((symbol) => {
			const declaration = new dox.Declaration(this.context, symbol);
			this.declarationsMap.set(declaration.name, declaration);
		});
	};
	public discoverRelationships = () => {
		this.fileSymbol.exports?.forEach((exported) =>
			this.mergeTriggers(exported),
		);
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
	public triggerRelationships = () => {
		this.relationshipTriggers.forEach((trigger) => trigger());
	};
	/*
	private registerDoxDeclarations = (symbol: ts.Symbol) => {

	};
	private mergeNewFiles = (symbol: ts.Symbol) => {
		const files = new dox.relationships.FileFinder(this.context, symbol);
		this.childFiles = [...this.childFiles, ...files.childFiles];
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
		declaration: ts.ExportSpecifier | ts.Identifier,
	) {
		const declarations = checker
			.getExportSpecifierLocalTargetSymbol(declaration)
			?.getDeclarations();

		return declarations && declarations.length > 1
			? (Dox.warn(
					Dox.class(),
					'Expected only one declaration in a local target symbol',
			  ) as undefined)
			: declarations
			? declarations[0]
			: undefined;
	}
	*/
}
