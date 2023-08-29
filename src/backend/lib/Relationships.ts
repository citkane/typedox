import * as ts from 'typescript';
import * as dox from '../typedox';
import { Dox } from './Dox';

/**
 * Builds a many to many mapping of all discovered `ts.Declarations`
 *
 * The mapping is applied into {@link dox.kinds.Declaration}.
 */
export default class Relationships extends Dox {
	name: string;
	get: dox.lib.WhatIsIt;
	filesMap: dox.fileMap;

	constructor(context: dox.lib.Context, symbol: ts.Symbol) {
		super(context);
		Relationships.class.bind(this);

		this.name = symbol.name;
		this.get = new dox.lib.WhatIsIt(this.checker, symbol);
		this.filesMap = context.reference!.filesMap;

		this.register(this.get.tsNode);

		this.debug(this.class, this.get.nodeDeclarationText);
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
	 * Cycles through all potential `ts.Node` types and registers them accordingly.
	 *
	 * This function is used recursively to register alias's and exports / re-exports from imports etc.
	 * @param node The subject node, which may switch to the alias or import, etc.
	 * @param get The subject information getter, which may switch to the alias or import, etc.
	 * @param _isLocalTarget Flag to better inform the error logger
	 * @returns
	 */
	private register(node: ts.Node, get = this.get, _isLocalTarget = false) {
		if (Relationships.canBeIgnored(node)) return;

		ts.isNamespaceExport(node)
			? this.registerNameSpaceExport(get)
			: ts.isNamespaceImport(node)
			? this.registerNameSpaceImport(get)
			: ts.isModuleDeclaration(node)
			? this.registerModuleDeclaration(node)
			: ts.isExportDeclaration(node)
			? this.registerExportDeclaration(get)
			: ts.isExportSpecifier(node)
			? this.registerExportSpecifier(get)
			: ts.isImportClause(node)
			? this.registerImportClause(get)
			: ts.isExportAssignment(node)
			? this.registerExportAssignment(node)
			: ts.isImportSpecifier(node)
			? this.registerImportSpecifier(node, get)
			: Relationships.fullReport(
					'error',
					this,
					this.class,
					`Did not parse a ${
						_isLocalTarget ? 'localTargetNode' : 'node'
					}`,
					get,
					_isLocalTarget,
			  );
	}
	private registerImportSpecifier(
		importSpecifier: ts.ImportSpecifier,
		get: dox.lib.WhatIsIt,
	) {
		const name = importSpecifier.name.getText();
		const source = this.localDoxDeclaration;
		const targetSource = this.filesMap.get(get.targetFileName!);
		const target = targetSource?.declarationsMap.get(name)!;

		source.children.set(name, target);
		target.parents.push(source);
	}
	private registerExportSpecifier(get: dox.lib.WhatIsIt) {
		if (get.localTargetDeclaration) {
			const local = get.localTargetDeclaration;
			const localGet = new dox.lib.WhatIsIt(this.checker, local);
			return this.register(local, localGet, true);
		}
		this.error(
			this.class,
			'An unknown ts.ExportSpecifier was encountered:',
			get.report,
		);
	}
	private registerExportDeclaration(get: dox.lib.WhatIsIt) {
		const targetSource = this.filesMap.get(get.targetFileName!)!;
		const targetSymbols = targetSource!.fileType.getProperties();
		const source = this.localDoxDeclaration;

		targetSymbols?.forEach((symbol) => {
			const name = symbol.getName();
			const target = targetSource.declarationsMap!.get(name)!;

			source.children.set(name, target);
			target.parents.push(source);
		});
	}
	private registerModuleDeclaration(moduleDeclaration: ts.ModuleDeclaration) {
		const moduleType = this.checker.getTypeAtLocation(
			moduleDeclaration.name,
		);
		const source = this.localDoxDeclaration;

		moduleType.getProperties().forEach((symbol) => {
			const target = new dox.Declaration(this.context, symbol);

			target.parents.push(source);
			source.children.set(target.name, target);
		});
	}
	private registerNameSpaceExport(get: dox.lib.WhatIsIt) {
		const remoteFile = this.filesMap.get(get.targetFileName!)!;
		const source = this.localDoxDeclaration;

		const setRelations = (symbol: ts.Symbol) => {
			const name = symbol.getName();
			const target = remoteFile.declarationsMap?.get(name)!;

			source.children.set(name, target);
			target.parents.push(source);
		};

		remoteFile.fileType.getProperties().forEach(setRelations);
	}
	private registerNameSpaceImport = (get: dox.lib.WhatIsIt) =>
		this.registerNameSpaceExport(get);
	private registerImportClause(get: dox.lib.WhatIsIt) {
		const remoteFile = this.filesMap.get(get.targetFileName!)!;
		const source = this.localDoxDeclaration;
		const target = remoteFile.declarationsMap.get(this.name)!;

		target.parents.push(source);
		source.children.set(this.name, target);
	}
	private registerExportAssignment(exportAssignment: ts.ExportAssignment) {
		const expressionGet = this.getter(exportAssignment);
		this.register(expressionGet.tsNode, expressionGet, true);
	}
}
