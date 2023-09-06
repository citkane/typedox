import * as ts from 'typescript';
import * as dox from '../typedox';

const log = dox.logger;
/**
 * Builds a many to many mapping of all discovered `ts.Declarations`
 *
 * The mapping is applied into {@link dox.kinds.Declaration}.
 */
export class Relation extends dox.DoxContext {
	public get: dox.TscWrapper;
	private name: string;
	private filesMap: dox.fileMap;
	private declaration: dox.TsDeclaration;
	private context: dox.DoxContext;

	constructor(context: dox.DoxContext, declaration: dox.TsDeclaration) {
		super(context);
		this.declaration = declaration;
		this.get = declaration.get;
		this.context = context;
		this.name = declaration.name;
		this.filesMap = declaration.parent.parent.filesMap;

		this.mapRelationships(this.get.tsNode);

		log.debug(log.identifier(this), this.get.nodeDeclarationText);
	}
	/** A `Map` of the local file's declarations keyed by name */
	private get localDeclarationMap() {
		return this.filesMap.get(this.get.fileName)!.declarationsMap;
	}
	/** The local declaration in scope */
	private get localDoxDeclaration() {
		return this.localDeclarationMap.get(this.name)!;
	}

	/**
	 * Cycles through all candidate `ts.Node` kinds and maps them accordingly.
	 *
	 * This function can recurse to register alias's and exports / re-exports from imports etc.
	 * @param node The subject node, which may switch to the alias or import, etc.
	 * @param get The subject ts api wrapper, which may switch to the alias or re-export, etc.
	 * @param _isLocalTarget Flag to better inform the error logger about recursion
	 * @returns
	 */
	private mapRelationships(
		node: ts.Node,
		get = this.get,
		_isLocalTarget = false,
	) {
		if (!dox.isSpecifierKind(node.kind) && !get.isExportStarChild) return;
		const errorMessage = `Did not parse a ${
			_isLocalTarget ? 'localTargetNode' : 'node'
		}`;

		get.isExportStarChild
			? this.mapExportStarChild(get)
			: ts.isNamespaceExport(node)
			? this.mapNameSpaceExport(get)
			: ts.isNamespaceImport(node)
			? this.mapNameSpaceImport(get)
			: ts.isModuleDeclaration(node)
			? this.mapModuleDeclaration(node)
			: ts.isExportSpecifier(node)
			? this.mapExportSpecifier(get)
			: ts.isImportClause(node)
			? this.mapImportClause(get)
			: ts.isExportAssignment(node)
			? this.mapExportAssignment(node)
			: ts.isImportSpecifier(node)
			? this.mapImportSpecifier(node, get)
			: dox.DoxProject.deepReport.call(
					this,
					'error',
					errorMessage,
					get,
					_isLocalTarget,
			  );
	}
	private mapImportSpecifier(
		importSpecifier: ts.ImportSpecifier,
		get: dox.TscWrapper,
	) {
		const name = importSpecifier.name.getText();
		const source = this.localDoxDeclaration;
		const targetSource = this.filesMap.get(get.targetFileName!);
		const target = targetSource?.declarationsMap.get(name)!;

		source.children.set(name, target);
		target.parents.push(source);
	}
	private mapExportSpecifier(get: dox.TscWrapper) {
		if (get.localTargetDeclaration) {
			const local = get.localTargetDeclaration;
			const localGet = this.tsWrap(local);
			return this.mapRelationships(local, localGet, true);
		}
		log.error(
			log.identifier(this),
			'An unknown ts.ExportSpecifier was encountered:',
			get.report,
		);
	}
	private registerReExporter(symbol: ts.Symbol) {
		dox.tsc.parseExportStars.call(this, symbol).forEach((expression) => {
			const get = this.tsWrap(expression);
			this.mapExportStarChild(get);
		});
	}
	private mapExportStarChild(get: dox.TscWrapper) {
		const targetSource = this.filesMap.get(get.targetFileName!)!;
		const targetSymbols = targetSource.fileSymbol.exports;
		const source = this.localDoxDeclaration;

		targetSymbols?.forEach((symbol) => {
			if (dox.tsc.isStarExport(symbol)) {
				return this.registerReExporter(symbol);
			}

			const name = symbol.getName();
			const target = targetSource.declarationsMap.get(name)!;

			if (source.children.has(name)) return;
			source.children.set(name, target);
			target.parents.push(source);
		});
	}
	private mapModuleDeclaration(moduleDeclaration: ts.ModuleDeclaration) {
		const moduleSymbol = this.tsWrap(moduleDeclaration).tsSymbol;
		const source = this.localDoxDeclaration;

		moduleSymbol.exports?.forEach((symbol) => {
			const target = new dox.TsDeclaration(this.context, symbol);

			target.parents.push(source);
			source.children.set(target.name, target);
		});
	}
	private mapNameSpaceExport(get: dox.TscWrapper) {
		const remoteFile = this.filesMap.get(get.targetFileName!)!;
		const source = this.localDoxDeclaration;

		[...(remoteFile.fileSymbol.exports?.values() || [])]
			.map(exportStars.bind(this))
			.flat()
			.forEach(setRelations);

		function setRelations(symbol: ts.Symbol) {
			const name = symbol.getName();

			const target = remoteFile.declarationsMap?.get(name)!;
			source.children.set(name, target);
			target.parents.push(source);
		}

		function exportStars(this: Relation, symbol: ts.Symbol) {
			return dox.tsc.isStarExport(symbol)
				? dox.tsc.parseExportStars
						.call(this, symbol)
						.map((expression) => this.tsWrap(expression).tsSymbol)
				: symbol;
		}
	}
	private mapNameSpaceImport = (get: dox.TscWrapper) => {
		this.mapNameSpaceExport(get);
	};
	private mapImportClause(get: dox.TscWrapper) {
		const remoteFile = this.filesMap.get(get.targetFileName!)!;
		const source = this.localDoxDeclaration;
		const target = remoteFile.declarationsMap.get(this.name)!;

		target.parents.push(source);
		source.children.set(this.name, target);
	}
	private mapExportAssignment(exportAssignment: ts.ExportAssignment) {
		const expressionGet = this.tsWrap(exportAssignment);
		this.mapRelationships(expressionGet.tsNode, expressionGet, true);
	}
}
