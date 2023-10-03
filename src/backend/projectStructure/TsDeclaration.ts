import * as ts from 'typescript';
import {
	DeclarationGroup,
	DoxConfig,
	TsReference,
	TsSourceFile,
	TscWrapper,
	declarationMap,
	logger as log,
	logLevels,
} from '../typedox';
import { identifier } from '../logger/loggerUtils';

/**
 * A container for typescript declarations:
 *
 * &emsp;DoxProject\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- NpmPackage[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- TsReference[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- TsSourceFile[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- **TsDeclaration**[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- Branch[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...**TsDeclaration**...
 *
 *
 */
export class TsDeclaration extends DoxConfig {
	public nameSpace?: string;
	public parent: TsSourceFile | TsDeclaration;
	public parents: Map<TsDeclaration, boolean> = new Map();
	public children: declarationMap = new Map();
	public wrappedItem: TscWrapper;
	public valueItem?: TscWrapper;
	public localDeclarationMap: declarationMap = new Map();
	private groupTsKind!: ts.SyntaxKind;
	private defaultStrings = ['default', 'export='];
	private debug = notices.parse.debug.bind(this);

	constructor(parent: TsSourceFile | TsDeclaration, item: ts.Symbol) {
		super();

		this.parent = parent;
		this.wrappedItem = this.tsWrap(item);

		this.declare(this.wrappedItem);
	}

	public get name() {
		return this.wrappedItem.name;
	}
	public get checker(): ts.TypeChecker {
		return this.parent.checker;
	}
	public get tsWrap(): TsReference['tsWrap'] {
		return this.parent.tsWrap;
	}

	public get group() {
		const { SyntaxKind } = ts;
		const { groupTsKind, wrappedItem, valueItem } = this;

		const kind = this.isArrowFunction
			? ts.SyntaxKind.FunctionDeclaration
			: valueItem?.kind || groupTsKind;

		const isModule =
			kind === SyntaxKind.ModuleDeclaration ||
			kind === SyntaxKind.NamespaceExport ||
			kind === SyntaxKind.NamespaceImport;
		const isType =
			kind === SyntaxKind.TypeAliasDeclaration ||
			kind === SyntaxKind.InterfaceDeclaration;

		const isReExport =
			kind === SyntaxKind.ImportSpecifier ||
			kind === SyntaxKind.ExportDeclaration;

		const groupKind = isModule
			? DeclarationGroup.Module
			: isType
			? DeclarationGroup.Type
			: isReExport
			? DeclarationGroup.ReExport
			: kind === SyntaxKind.VariableDeclaration
			? DeclarationGroup.Variable
			: kind === SyntaxKind.ClassDeclaration
			? DeclarationGroup.Class
			: kind === SyntaxKind.FunctionDeclaration
			? DeclarationGroup.Function
			: kind === SyntaxKind.EnumDeclaration
			? DeclarationGroup.Enum
			: kind === SyntaxKind.ExportAssignment
			? DeclarationGroup.Default
			: this.isSpecifierKind(wrappedItem.kind)
			? undefined
			: DeclarationGroup.unknown;

		groupKind === DeclarationGroup.unknown &&
			notices.groupKind(kind, this.wrappedItem, log.stackTracer());

		return groupKind;
	}
	public mapRelationships = (get = this.wrappedItem, isTarget = false) => {
		if (!this.isSpecifierKind(get.kind)) return;

		type routeKey = keyof typeof TsDeclaration.relationshipRoutes;
		const key = ts.SyntaxKind[get.kind] as routeKey;
		const routeFunction = TsDeclaration.relationshipRoutes[key];

		routeFunction
			? routeFunction.call(this, get)
			: notices.report.call(this, get, isTarget);
	};
	private declare = (get = this.wrappedItem, isTarget = false) => {
		if (get.kind === ts.SyntaxKind.Identifier) {
			const { valueDeclaration } = get.tsSymbol;
			get = valueDeclaration ? this.tsWrap(valueDeclaration) : get;
		}
		this.groupTsKind = get.kind;

		if (!this.isSpecifierKind(get.kind)) return (this.valueItem = get);

		type routeKey = keyof typeof TsDeclaration.declarationRoutes;
		const key = ts.SyntaxKind[get.kind] as routeKey;
		const routeFunction = TsDeclaration.declarationRoutes[key];

		routeFunction
			? routeFunction.call(this, get)
			: notices.report.call(this, get, isTarget);
	};
	private adopt = (child: TsDeclaration) => {
		child.parents.set(this, true);
		this.children.set(child.name, child);
	};
	private findDeclaration = (
		get: TscWrapper,
		fileName = get.fileName,
		names = [get.name],
	) => {
		const { reference, notFound } = this;
		const { filesMap } = reference;

		const file = filesMap.get(fileName);
		if (!file) return notFound(get, 'file');

		let declaration: TsDeclaration | undefined;
		const { declarationsMap } = file;
		file.discoverDeclarations();
		names.forEach((name) => {
			declaration = declaration ??= declarationsMap.get(name);
		});
		return declaration || this.notFound(get, 'declaration');
	};
	private declareLocal = (symbol: ts.Symbol, name?: string) => {
		const declaration = new TsDeclaration(this, symbol);
		this.localDeclarationMap.set(name || declaration.name, declaration);

		return declaration;
	};
	private get notFound() {
		return notices.notFound.bind(this);
	}
	private get sourceFile() {
		const getSourcefile = (
			parent: TsSourceFile | TsDeclaration,
		): TsSourceFile => {
			return parent.isTsSourceFile
				? (parent as TsSourceFile)
				: getSourcefile(parent.parent as TsDeclaration);
		};
		return getSourcefile(this.parent);
	}
	private get reference() {
		return this.sourceFile.parent;
	}
	private get isArrowFunction() {
		return (
			this.valueItem &&
			ts.isVariableDeclaration(this.valueItem?.tsNode) &&
			this.valueItem?.callSignatures.length
		);
	}

	public static isExportSpecifier = ts.isExportSpecifier; //stub hack for testing purposes

	private static relationshipRoutes = {
		ExportAssignment(this: TsDeclaration, get: TscWrapper) {
			this.debug('relate ExportAssignment');

			const target = get.target && this.tsWrap(get.target);
			target
				? this.mapRelationships(target, true)
				: this.notFound(get, 'target');
		},
		ExportDeclaration(this: TsDeclaration, get: TscWrapper) {
			this.debug('relate ExportDeclaration');

			const { tsWrap, notFound, reference } = this;
			const { filesMap } = reference;

			get.tsSymbol.declarations?.forEach(parseDeclaration.bind(this));

			function parseDeclaration(
				this: TsDeclaration,
				declaration: ts.Declaration,
			) {
				const { targetFileName } = tsWrap(declaration);
				const file = targetFileName && filesMap.get(targetFileName);
				if (!file) return notFound(get, 'file');

				file.discoverDeclarations();
				file.declarationsMap.forEach((child) => {
					if (['default', 'exports='].includes(child.name)) return;
					this.adopt(child);
				});
			}
		},
		ExportSpecifier(this: TsDeclaration, get: TscWrapper) {
			this.debug('relate ExportSpecifier');

			const { tsWrap, notFound } = this;

			get.moduleSpecifier
				? parseModule.call(this, get.moduleSpecifier)
				: parseLocal.call(this);

			function parseModule(
				this: TsDeclaration,
				expression: ts.Expression,
			) {
				const { targetFileName: fileName } = tsWrap(expression);
				const child = fileName && this.findDeclaration(get, fileName);
				if (!child) return;

				this.adopt(child);
			}

			function parseLocal(this: TsDeclaration) {
				get.target
					? this.mapRelationships(tsWrap(get.target))
					: notFound(get, 'target');
			}
		},
		ImportClause(this: TsDeclaration, get: TscWrapper) {
			this.debug('relate ImportClause');
			const { notFound, findDeclaration } = this;

			const { targetFileName } = get;
			if (!targetFileName) return notFound(get, 'target file');

			const child = findDeclaration(
				get,
				targetFileName,
				this.defaultStrings,
			);
			if (!child) return;

			this.adopt(child);
		},
		/** eg, "export import foo = moduleDeclaration" */
		ImportEqualsDeclaration(this: TsDeclaration, get: TscWrapper) {
			this.debug('relate ImportEqualsDeclaration');

			get.target
				? this.mapRelationships(this.tsWrap(get.target))
				: this.notFound(get, 'target');
		},
		ImportSpecifier(this: TsDeclaration, get: TscWrapper) {
			this.debug('relate ImportSpecifier');

			const { targetFileName: fileName } = get;

			const child = fileName && this.findDeclaration(get, fileName);
			if (!child) return;

			this.adopt(child);
		},
		ModuleDeclaration(this: TsDeclaration, get: TscWrapper) {
			this.debug('relate ModuleDeclaration');

			get.declaredModuleSymbols?.forEach((symbol) => {
				const get = this.tsWrap(symbol);
				this.mapRelationships(get);
			});
		},
		NamespaceExport(
			this: TsDeclaration,
			get: TscWrapper,
			skipNotice = false,
		) {
			!skipNotice && this.debug('relate NamespaceExport');

			const { targetFileName: fileName } = get;

			const file = fileName && this.reference.filesMap.get(fileName);
			if (!file) return this.notFound(get, 'file');

			file.declarationsMap.forEach(this.adopt);
		},
		NamespaceImport(this: TsDeclaration, get: TscWrapper) {
			this.debug('relate NamespaceImport');

			TsDeclaration.relationshipRoutes.NamespaceExport.call(
				this,
				get,
				true,
			);
		},
	};
	private static declarationRoutes = {
		ExportAssignment(this: TsDeclaration, get: TscWrapper) {
			this.debug('declare ExportAssignment');

			get.target
				? this.declare(this.tsWrap(get.target))
				: this.notFound(get, 'target');
		},
		ExportDeclaration(this: TsDeclaration, get: TscWrapper) {
			this.debug('declare ExportDeclaration');

			const { notFound, tsWrap, declareLocal } = this;
			get.tsSymbol.declarations?.forEach((declaration) => {
				const { moduleSpecifier } = tsWrap(declaration);
				if (!moduleSpecifier) return notFound(get, 'moduleSpecifier');

				const { declaredModuleSymbols } = tsWrap(moduleSpecifier);
				declaredModuleSymbols.forEach(
					(symbol) =>
						!this.defaultStrings.includes(symbol.name) &&
						declareLocal(symbol),
				);
			});
		},
		ExportSpecifier(this: TsDeclaration, get: TscWrapper) {
			this.debug('declare ExportSpecifier');

			get.target
				? this.declare(this.tsWrap(get.target))
				: this.notFound(get, 'target');
		},
		ImportClause(this: TsDeclaration, get: TscWrapper) {
			this.debug('declare ImportClause');

			const target = get.immediatelyAliasedSymbol;
			target
				? this.declare(this.tsWrap(target))
				: this.notFound(get, 'immediatelyAliasedSymbol');
		},
		ImportEqualsDeclaration(this: TsDeclaration, get: TscWrapper) {
			this.debug('declare ImportEqualsDeclaration');

			get.target
				? this.declare(this.tsWrap(get.target))
				: this.notFound(get, 'target');
		},
		ImportSpecifier(this: TsDeclaration, get: TscWrapper) {
			this.debug('declare ImportSpecifier');

			const target = get.immediatelyAliasedSymbol;
			target
				? this.declare(this.tsWrap(target))
				: this.notFound(get, 'immediatelyAliasedSymbol');
		},
		ModuleDeclaration(this: TsDeclaration, get: TscWrapper) {
			this.debug('declare ModuleDeclaration');

			const node = get.tsNode as ts.ModuleDeclaration;
			this.nameSpace = node.name.getText();

			get.declaredModuleSymbols?.forEach((symbol) => {
				const get = this.tsWrap(symbol);
				!this.isSpecifierKind(get.kind) && this.declareLocal(symbol);
			});
			this.valueItem = get;
		},
		NamespaceExport(
			this: TsDeclaration,
			get: TscWrapper,
			skipNotice = false,
		) {
			!skipNotice && this.debug('declare NamespaceExport');

			this.nameSpace = get.name;
			this.groupTsKind = ts.SyntaxKind.ModuleDeclaration;
		},
		NamespaceImport(this: TsDeclaration, get: TscWrapper) {
			this.debug('declare NamespaceImport');

			const fnc = TsDeclaration.declarationRoutes.NamespaceExport;
			fnc.call(this, get, true);
		},
	};
}

const notices = {
	groupKind: function (
		tsKind: ts.SyntaxKind | undefined,
		get: TscWrapper,
		stack: string,
	) {
		log.error(
			log.identifier(__filename),
			'Did not discover a group kind:',
			tsKind ? ts.SyntaxKind[tsKind] : 'undefined',
			get.report,
			stack,
		);
	},
	parse: {
		debug: function (this: TsDeclaration, fncName: string) {
			log.debug(
				log.identifier(this),
				`[${fncName}]`,
				`[${log.toLine(this.wrappedItem.nodeText, 40)}]`,
				log.toLine(this.wrappedItem.nodeDeclarationText, 110),
			);
		},
	},
	report: function (this: TsDeclaration, get: TscWrapper, local: boolean) {
		const errorMessage = `Did not map a ${
			local ? 'localTargetNode' : 'node'
		} relationship`;
		deepReport.call(this, __filename, 'error', errorMessage, get, local);
	},
	notFound: function (
		this: TsDeclaration,
		get: TscWrapper,
		notFound: string,
	) {
		log.error(
			identifier(this),
			`[${get.kindString}]`,
			'Did not find a',
			notFound,
			log.stackTracer(),
		);
		return undefined;
	},
};

function deepReport(
	this: TsDeclaration,
	location: string,
	logLevel: keyof typeof logLevels,
	message: string,
	get: TscWrapper,
	isLocalTarget: boolean,
) {
	log[logLevel](log.identifier(location), message, {
		filename: this.wrappedItem.fileName,
		sourceReport: this.wrappedItem.report,
		sourceDeclaration: this.wrappedItem.nodeDeclarationText,

		targetReport: isLocalTarget
			? /* istanbul ignore next */
			  get.report
			: undefined,
		targetDeclaration: isLocalTarget
			? /* istanbul ignore next */
			  get.nodeDeclarationText
			: undefined,
	});
}
