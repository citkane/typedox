import * as ts from 'typescript';
import {
	DoxConfig,
	DoxProject,
	TsDeclaration,
	TsSourceFile,
	TscWrapper,
	fileMap,
	logger as log,
	tsc,
} from '../typedox';

/**
 * Builds a many to many mapping of all discovered `ts.Declarations`
 *
 * The mapping is applied into {@link dox.Declaration}.
 */
export class Relation extends DoxConfig {
	public get: TscWrapper;
	private tsSourceFile: TsSourceFile;
	private name: string;
	private filesMap: fileMap;
	private parent;

	constructor(parent: TsSourceFile, declaration: TsDeclaration) {
		super(parent.checker);
		this.parent = parent;
		this.tsSourceFile = parent;
		this.get = declaration.get;
		this.name = declaration.name;
		this.filesMap = declaration.parent.parent.filesMap as any;

		this.mapRelationships(this.get.tsNode);
	}
	/** A `Map` of the local file's declarations keyed by name */
	private get localDeclarationMap() {
		const fileName = this.get.fileName;
		return this.filesMap.get(fileName)!.declarationsMap;
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
		if (!this.isSpecifierKind(node.kind) && !get.isReExport) return;
		const errorMessage = `Did not map a ${
			_isLocalTarget ? 'localTargetNode' : 'node'
		} relationship`;

		get.isReExport
			? this.mapReExport(get)
			: ts.isNamespaceExport(node) || ts.isNamespaceImport(node)
			? this.mapNameSpaceExport(get)
			: ts.isModuleDeclaration(node)
			? this.mapModuleDeclaration(node)
			: Relation.isExportSpecifier(node)
			? this.mapExportSpecifier(get)
			: ts.isImportSpecifier(node)
			? this.mapImportSpecifier(node, get)
			: ts.isExportAssignment(node)
			? this.mapExportAssignment(node)
			: DoxProject.deepReport.call(
					this,
					__filename,
					'error',
					errorMessage,
					get,
					_isLocalTarget,
			  );

		//Not discovered yet??
		/*
			: ts.isImportClause(node)
			? this.mapImportClause(get)

		*/
	}
	private mapReExport(get: TscWrapper) {
		notices.map.debug.call(this, 'mapReExport');

		const targetSource = this.filesMap.get(get.targetFileName!)!;
		const targetSymbols = targetSource.fileSymbol.exports!;
		const source = this.localDoxDeclaration;

		targetSymbols.forEach((symbol) => {
			if (tsc.isReExport(symbol)) return this.registerReExporter(symbol);

			const name = symbol.getName();
			const target = targetSource.declarationsMap.get(name)!;

			if (source.children.has(name)) return;
			source.children.set(name, target);
			target.parents.push(source);
		});
	}
	private mapNameSpaceExport(get: TscWrapper) {
		notices.map.debug.call(this, 'mapNameSpaceExport');

		if (!get.targetFileName) return;

		const remoteFile = this.filesMap.get(get.targetFileName!)!;
		const source = this.localDoxDeclaration;

		Array.from(remoteFile.fileSymbol.exports!.values())
			.map(reExport.bind(this))
			.flat()
			.forEach(setRelations);

		function setRelations(symbol: ts.Symbol) {
			const name = symbol.getName();
			const target = remoteFile.declarationsMap.get(name)!;
			source.children.set(name, target);
			target.parents.push(source);
		}

		function reExport(this: Relation, symbol: ts.Symbol) {
			return tsc.isReExport(symbol)
				? tsc.parseReExport
						.call(this, symbol)
						.map((expression) => this.tsWrap(expression).tsSymbol)
				: symbol;
		}
	}
	private mapModuleDeclaration(moduleDeclaration: ts.ModuleDeclaration) {
		notices.map.debug.call(this, 'mapModuleDeclaration');

		const source = this.localDoxDeclaration;

		this.tsSourceFile.getModuleDeclarationSymbols().forEach((symbol) => {
			const target = new TsDeclaration(this.parent, symbol);

			target.parents.push(source);
			source.children.set(target.name, target);
		});
	}
	private mapExportSpecifier(get: TscWrapper) {
		notices.map.debug.call(this, 'mapExportSpecifier');

		const local = get.localTargetDeclaration!;
		const localGet = this.tsWrap(local);
		return this.mapRelationships(local, localGet, true);
	}
	private mapImportSpecifier(
		importSpecifier: ts.ImportSpecifier,
		get: TscWrapper,
	) {
		notices.map.debug.call(this, 'mapImportSpecifier');

		const name = importSpecifier.name.getText();

		const source = this.localDoxDeclaration;
		const remoteFile = this.filesMap.get(get.targetFileName!)!;
		const target = remoteFile.declarationsMap.get(name)!;

		source.children.set(name, target);
		target.parents.push(source);
	}
	/** Maps the "default" export */
	private mapExportAssignment(exportAssignment: ts.ExportAssignment) {
		notices.map.debug.call(this, 'mapExportAssignment');

		const get = this.tsWrap(this.get.immediatelyAliasedSymbol!);
		this.mapRelationships(get.tsNode, get, true);
	}

	private registerReExporter(symbol: ts.Symbol) {
		notices.map.debug.call(this, 'registerReExporter');

		tsc.parseReExport.call(this, symbol).forEach((expression) => {
			const get = this.tsWrap(expression);
			this.mapReExport(get);
		});
	}

	//Not discovered yet??
	/*
	private mapImportClause(get: TscWrapper) {
		notices.map.debug.call(this, 'mapImportClause');

		const name = this.name;

		const source = this.localDoxDeclaration;
		const remoteFile = this.filesMap.get(get.targetFileName!)!;
		const target = remoteFile.declarationsMap.get(name)!;

		source.children.set(name, target);
		target.parents.push(source);
	}

	*/

	static isExportSpecifier = ts.isExportSpecifier; //hack for testing stub purposes
}

const notices = {
	map: {
		debug: function (this: Relation, fncName: string) {
			log.debug(
				log.identifier(this),
				`[${fncName}]`,
				`[${log.toLine(this.get.nodeText)}]`,
				log.toLine(this.get.nodeDeclarationText),
			);
		},
	},
};
