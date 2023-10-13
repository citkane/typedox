import * as ts from 'typescript';
import {
	DeclarationFlags,
	DeclarationGroup,
	DoxConfig,
	DoxReference,
	DoxSourceFile,
	TscWrapper,
	declarationsMap,
	logger as log,
	logLevels,
} from '../typedox';
import { identifier } from '../logger/loggerUtils';

/**
 * A container for typescript declarations:
 *
 * &emsp;DoxProject\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- DoxPackage[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- DoxReference[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- DoxSourceFile[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- **DoxDeclaration**[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- Branch[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...**DoxDeclaration**...
 *
 *
 */
export class DoxDeclaration extends DoxConfig {
	public nameSpace?: string;
	public parent: DoxSourceFile | DoxDeclaration;
	public parents: Map<DoxDeclaration, boolean> = new Map();
	public children: declarationsMap = new Map();
	public wrappedItem: TscWrapper;
	public valueItem?: TscWrapper;
	public localDeclarationMap: declarationsMap = new Map();
	public flags: DeclarationFlags = {};
	private groupTsKind!: ts.SyntaxKind;
	private defaultStrings = ['default', 'export='];
	private debug = notices.parse.debug.bind(this);

	constructor(parent: DoxSourceFile | DoxDeclaration, item: ts.Symbol) {
		super();

		this.parent = parent;
		this.wrappedItem = this.tsWrap(item);

		this.declare(this.wrappedItem);
	}

	public get name() {
		return this.wrappedItem.name;
	}
	public get group() {
		const {
			VariableDeclaration,
			ClassDeclaration,
			FunctionDeclaration,
			EnumDeclaration,
		} = ts.SyntaxKind;
		const { kind, isModule, isType, isReExport } = this.parseGroup();

		const groupKind = isModule
			? DeclarationGroup.Module
			: isType
			? DeclarationGroup.Type
			: isReExport
			? DeclarationGroup.ReExport
			: kind === VariableDeclaration
			? DeclarationGroup.Variable
			: kind === ClassDeclaration
			? DeclarationGroup.Class
			: kind === FunctionDeclaration
			? DeclarationGroup.Function
			: kind === EnumDeclaration
			? DeclarationGroup.Enum
			: DeclarationGroup.unknown;

		if (groupKind === DeclarationGroup.unknown) {
			notices.groupKind(kind, this.wrappedItem, log.stackTracer());
		}

		return groupKind;
	}
	public get checker() {
		return this.doxSourceFile.checker;
	}
	public get doxReference() {
		return this.doxSourceFile.parent;
	}
	public get doxSourceFile() {
		const getSourcefile = (
			parent: DoxSourceFile | DoxDeclaration,
		): DoxSourceFile => {
			return parent.isDoxSourceFile
				? (parent as DoxSourceFile)
				: getSourcefile(parent.parent as DoxDeclaration);
		};
		return getSourcefile(this.parent);
	}
	public get doxFilesMap() {
		return this.doxReference.filesMap;
	}
	public get declarationsMap() {
		return this.doxSourceFile.declarationsMap;
	}

	public get tsWrap(): DoxReference['tsWrap'] {
		return this.parent.tsWrap;
	}
	public relate = (get: TscWrapper, isTarget = false) => {
		if (!this.isSpecifierKind(get.kind)) return;

		type routeKey = keyof typeof DoxDeclaration.relationshipRoutes;
		const key = ts.SyntaxKind[get.kind] as routeKey;
		const routeFunction = DoxDeclaration.relationshipRoutes[key];

		routeFunction
			? routeFunction.call(this, get)
			: /* istanbul ignore next: soft error for debugging */
			  notices.report.call(this, get, isTarget);
	};
	private declare = (get: TscWrapper, isTarget = false) => {
		this.groupTsKind = get.kind;

		if (!this.isSpecifierKind(get.kind)) return (this.valueItem = get);

		type routeKey = keyof typeof DoxDeclaration.declarationRoutes;
		const key = ts.SyntaxKind[get.kind] as routeKey;
		const routeFunction = DoxDeclaration.declarationRoutes[key];

		routeFunction
			? routeFunction.call(this, get)
			: /* istanbul ignore next: soft error for debugging */
			  notices.report.call(this, get, isTarget);
	};
	private static relationshipRoutes = {
		ExportAssignment(this: DoxDeclaration, get: TscWrapper) {
			this.debug('relate ExportAssignment');

			const target = get.target;
			target
				? this.relate(target, true)
				: /* istanbul ignore next: soft error for debugging */
				  this.notFound(get, 'target');
		},
		ExportDeclaration(this: DoxDeclaration, get: TscWrapper) {
			this.debug('relate ExportDeclaration');

			const { targetFileName } = get;
			const file = targetFileName && this.doxFilesMap.get(targetFileName);
			/* istanbul ignore next: soft error for debugging */
			if (!file) return this.fileNotFound(get, targetFileName);

			file.declarationsMap.forEach((child) => {
				const { wrappedItem, name } = child;
				const { tsNode } = wrappedItem;
				const isExportDeclaration = ts.isExportDeclaration(tsNode);

				if (this.defaultStrings.includes(name)) return;
				if (!isExportDeclaration) return this.adopt(child);
				this.relate(wrappedItem, true);
			});
		},
		ExportSpecifier(this: DoxDeclaration, get: TscWrapper) {
			this.debug('relate ExportSpecifier');

			const { notFound, adopt, findChildDeclaration } = this;

			get.moduleSpecifier
				? parseModule.call(this, get.moduleSpecifier)
				: parseLocal.call(this);

			function parseModule(
				this: DoxDeclaration,
				expression: ts.Expression,
			) {
				//const { targetFileName: fileName } = tsWrap(expression);
				const child = findChildDeclaration(get, expression);
				/* istanbul ignore next: soft error for debugging */
				if (!child) return;

				adopt(child);
			}

			function parseLocal(this: DoxDeclaration) {
				get.target
					? this.relate(get.target)
					: /* istanbul ignore next: soft error for debugging */
					  notFound(get, 'target');
			}
		},
		ImportClause(this: DoxDeclaration, get: TscWrapper) {
			this.debug('relate ImportClause');

			const { findChildDeclaration, defaultStrings } = this;

			const child = findChildDeclaration(
				get,
				get.moduleSpecifier!,
				defaultStrings,
			);
			/* istanbul ignore next: soft error for debugging */
			if (!child) return;

			this.adopt(child);
		},
		/** eg, "export import foo = moduleDeclaration" */
		ImportEqualsDeclaration(this: DoxDeclaration, get: TscWrapper) {
			this.debug('relate ImportEqualsDeclaration');
			get.target
				? this.relate(get.target)
				: /* istanbul ignore next: soft error for debugging */
				  this.notFound(get, 'target');
		},
		ImportSpecifier(this: DoxDeclaration, get: TscWrapper) {
			this.debug('relate ImportSpecifier');

			const { findChildDeclaration } = this;
			//const { targetFileName: fileName } = get;
			const child = findChildDeclaration(get, get.moduleSpecifier!);
			/* istanbul ignore next: soft error for debugging */
			if (!child) return;

			this.adopt(child);
		},
		ModuleDeclaration(this: DoxDeclaration, get: TscWrapper) {
			this.debug('relate ModuleDeclaration');

			get.declaredModuleSymbols!.forEach((symbol) => {
				const get = this.tsWrap(symbol);
				this.relate(get);
			});
		},
		NamespaceExport(
			this: DoxDeclaration,
			get: TscWrapper,
			skipNotice = false,
		) {
			!skipNotice && this.debug('relate NamespaceExport');

			const { targetFileName } = get;
			const file =
				targetFileName &&
				this.doxReference.filesMap.get(targetFileName);
			/* istanbul ignore next: soft error for debugging */
			if (!file) return this.fileNotFound(get, targetFileName);
			file.declarationsMap.forEach((child) => {
				const { wrappedItem } = child;
				const isExportDeclaration = ts.isExportDeclaration(
					wrappedItem.tsNode,
				);
				if (!isExportDeclaration) return this.adopt(child);
				this.relate(wrappedItem, true);
			});
		},
		NamespaceImport(this: DoxDeclaration, get: TscWrapper) {
			this.debug('relate NamespaceImport');

			const aliasFnc = DoxDeclaration.relationshipRoutes.NamespaceExport;
			aliasFnc.call(this, get, true);
		},
		/*
		BindingElement(this: DoxDeclaration, get: TscWrapper) {
			log.error(
				log.identifier(this),
				'Working on Binding Elements, see: https://tinyurl.com/bdyp5rpb',
			);
		},
		ObjectLiteralExpression(this: DoxDeclaration, get: TscWrapper) {},
		*/
	};
	private static declarationRoutes = {
		ExportAssignment(this: DoxDeclaration, get: TscWrapper) {
			this.debug('declare ExportAssignment');

			this.flags.default = true;
			get.target
				? this.declare(get.target)
				: /* istanbul ignore next: soft error for debugging */
				  this.notFound(get, 'target');
		},
		ExportDeclaration(this: DoxDeclaration, get: TscWrapper) {
			this.debug('declare ExportDeclaration');
		},
		ExportSpecifier(this: DoxDeclaration, get: TscWrapper) {
			this.debug('declare ExportSpecifier');

			get.target
				? this.declare(get.target)
				: /* istanbul ignore next: soft error for debugging */
				  this.notFound(get, 'target');
		},
		ImportClause(this: DoxDeclaration, get: TscWrapper) {
			this.debug('declare ImportClause');

			const target = get.immediatelyAliasedSymbol;
			target
				? this.declare(this.tsWrap(target))
				: /* istanbul ignore next: soft error for debugging */
				  this.notFound(get, 'immediatelyAliasedSymbol');
		},
		ImportEqualsDeclaration(this: DoxDeclaration, get: TscWrapper) {
			this.debug('declare ImportEqualsDeclaration');

			get.target
				? this.declare(get.target)
				: /* istanbul ignore next: soft error for debugging */
				  this.notFound(get, 'target');
		},
		ImportSpecifier(this: DoxDeclaration, get: TscWrapper) {
			this.debug('declare ImportSpecifier');

			const target = get.immediatelyAliasedSymbol;
			target
				? this.declare(this.tsWrap(target))
				: /* istanbul ignore next: soft error for debugging */
				  this.notFound(get, 'immediatelyAliasedSymbol');
		},
		ModuleDeclaration(this: DoxDeclaration, get: TscWrapper) {
			this.debug('declare ModuleDeclaration');

			const node = get.tsNode as ts.ModuleDeclaration;
			this.nameSpace = node.name.getText();

			get.declaredModuleSymbols.forEach((symbol) => {
				const get = this.tsWrap(symbol);
				const declarable =
					!this.isSpecifierKind(get.kind) ||
					ts.isModuleDeclaration(get.tsNode);

				declarable && this.declareLocal(symbol);
			});
			this.valueItem = get;
		},
		NamespaceExport(
			this: DoxDeclaration,
			get: TscWrapper,
			skipNotice = false,
		) {
			!skipNotice && this.debug('declare NamespaceExport');

			this.nameSpace = get.name;
			this.groupTsKind = ts.SyntaxKind.ModuleDeclaration;
		},
		NamespaceImport(this: DoxDeclaration, get: TscWrapper) {
			this.debug('declare NamespaceImport');

			const fnc = DoxDeclaration.declarationRoutes.NamespaceExport;
			fnc.call(this, get, true);
		},
		/*
		BindingElement(this: DoxDeclaration, get: TscWrapper) {
			const node = get.tsNode as ts.BindingElement;

			const foo = ts.walkUpBindingElementsAndPatterns(node);

			console.info(log.identifier(this), foo.getText());
		},
		ObjectLiteralExpression(this: DoxDeclaration, get: TscWrapper) {},
		*/
	};
	private adopt = (child: DoxDeclaration) => {
		child.parents.set(this, true);
		this.children.set(child.name, child);
	};

	/**
	 * Finds and returns the typedox doxDeclaration that has been referenced in a relationship.
	 * 1. Identify the target file name.
	 * 2. Retrieve the target doxSourceFile from the fileMap.
	 * 3. Retrieve the doxDeclaration from the doxSourceFile
	 * @param source the wrapped node from the ts.SourceFile AST.
	 * @param expression
	 * @param names could be just a [name], or the unforeseeable option ['export=','default']
	 * @returns the related doxDeclaration
	 */
	private findChildDeclaration = (
		source: TscWrapper,
		expression: ts.Expression,
		names = [source.alias || source.name],
	): DoxDeclaration | undefined => {
		const { checker, doxFilesMap } = this;

		let declaration: DoxDeclaration | undefined;
		names.forEach((name) => {
			if (declaration) return;
			const location = checker.getSymbolAtLocation(expression);
			const targetFile = location && getFilename(name, location);
			if (!targetFile) return;
			const declarationsMap =
				doxFilesMap.get(targetFile)?.declarationsMap;
			declaration = declarationsMap?.get(name);
		});

		return declaration;

		function getFilename(
			name: string,
			locationSymbol: ts.Symbol,
		): string | undefined {
			const { exports } = locationSymbol;
			let tsDeclarations = exports?.get(name as any)?.declarations;
			let declaration = tsDeclarations && tsDeclarations[0];
			const targetFile = declaration?.getSourceFile().fileName;

			if (targetFile) return targetFile;

			tsDeclarations = exports?.get('__export' as any)?.declarations;
			declaration = tsDeclarations && tsDeclarations[0];
			const moduleSpecifier = (declaration as any)?.moduleSpecifier;
			const exportLocation =
				moduleSpecifier && checker.getSymbolAtLocation(moduleSpecifier);

			return exportLocation
				? getFilename(name, exportLocation)
				: undefined;
		}
	};
	private declareLocal = (symbol: ts.Symbol, name?: string) => {
		const declaration = new DoxDeclaration(this, symbol);
		this.localDeclarationMap.set(name || declaration.name, declaration);

		return declaration;
	};
	/* istanbul ignore next: soft error for debugging */
	private fileNotFound = (get: TscWrapper, fileName?: string) => {
		const message = `An invalid file was referenced: "${get.nodeDeclarationText}" in`;
		fileName
			? this.notFound(get, get.fileName, message, 'warn')
			: this.notFound(get, 'file');
	};
	private parseGroup = () => {
		const { SyntaxKind } = ts;
		const { groupTsKind, valueItem } = this;

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

		return { kind, isModule, isType, isReExport };
	};
	private get notFound() {
		return notices.notFound.bind(this);
	}

	private get isArrowFunction() {
		return (
			this.valueItem &&
			ts.isVariableDeclaration(this.valueItem.tsNode) &&
			this.valueItem.callSignatures.length
		);
	}
	private foo = 0;
}

const notices = {
	groupKind: function (
		tsKind: ts.SyntaxKind,
		get: TscWrapper,
		stack: string,
	) {
		log.error(
			log.identifier(__filename),
			'Did not discover a group kind:',
			ts.SyntaxKind[tsKind],
			get.report,
			//stack,
		);
	},
	parse: {
		debug: function (this: DoxDeclaration, fncName: string) {
			log.debug(
				log.identifier(this),
				`[${fncName}]`,
				`[${log.toLine(this.wrappedItem.nodeText, 40)}]`,
				log.toLine(this.wrappedItem.nodeDeclarationText, 110),
			);
		},
	},

	report:
		/* istanbul ignore next: soft error for debugging */
		function (this: DoxDeclaration, get: TscWrapper, local: boolean) {
			const errorMessage = `Did not map a ${
				local ? 'localTargetNode' : 'node'
			} relationship`;
			deepReport.call(
				this,
				__filename,
				'error',
				errorMessage,
				get,
				local,
			);
		},

	notFound:
		/* istanbul ignore next: soft error for debugging */
		function (
			this: DoxDeclaration,
			get: TscWrapper,
			notFound: string,
			message = 'Did not find a',
			level = 'error' as Exclude<keyof typeof logLevels, 'silent'>,
		) {
			log[level](
				identifier(this),
				`[${get.kindString}]`,
				message,
				`${notFound}`,
				level === 'error' ? get.report : '',
				level === 'error' ? log.stackTracer() : '',
			);
			return undefined;
		},
};
/* istanbul ignore next: soft error for debugging */
function deepReport(
	this: DoxDeclaration,
	location: string,
	logLevel: Exclude<keyof typeof logLevels, 'silent'>,
	message: string,
	get: TscWrapper,
	isLocalTarget: boolean,
) {
	log[logLevel](log.identifier(location), message, {
		filename: this.wrappedItem.fileName,
		sourceReport: this.wrappedItem.report,
		sourceDeclaration: this.wrappedItem.nodeDeclarationText,

		targetReport: isLocalTarget ? get.report : undefined,
		targetDeclaration: isLocalTarget ? get.nodeDeclarationText : undefined,
	});
}
