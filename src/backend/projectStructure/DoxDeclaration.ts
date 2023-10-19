import * as ts from 'typescript';
import {
	DeclarationFlags,
	DeclarationGroup,
	DoxConfig,
	DoxReference,
	DoxSourceFile,
	TsWrapper,
	declarationsMap,
	logger as log,
	logLevels,
	loggerUtils,
} from '../typedox';
import { identifier } from '../logger/loggerUtils';
import { Dox } from './Dox';

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
export class DoxDeclaration extends Dox {
	public nameSpace?: string;
	public parent: DoxSourceFile | DoxDeclaration;
	public parents: Map<DoxDeclaration, boolean> = new Map();
	public children: declarationsMap = new Map();
	public wrappedItem: TsWrapper;

	public localDeclarationMap: declarationsMap = new Map();
	public flags: DeclarationFlags = {};
	private groupTsKind!: ts.SyntaxKind;
	private defaultStrings = ['default', 'export='];
	private debug = notices.parse.debug.bind(this);
	private _valueNode!: ts.Node;

	constructor(
		parent: DoxSourceFile | DoxDeclaration,
		item: ts.Symbol,
		notExported: boolean = false,
	) {
		super();

		this.parent = parent;
		this.wrappedItem = this.tsWrap(item);
		this.valueNode = this.wrappedItem.tsNode;
		notExported && (this.flags.notExported = true);

		this.declare(this.wrappedItem);
	}

	public get name() {
		return this.wrappedItem.name;
	}
	public get group() {
		const {
			kind,
			isModule,
			isType,
			isReExport,
			isFunction,
			isClass,
			isVariable,
			isEnum,
		} = parseGroup(this.groupTsKind, this.isArrowFunction);

		const groupKind = isModule
			? DeclarationGroup.Module
			: isVariable
			? DeclarationGroup.Variable
			: isType
			? DeclarationGroup.Type
			: isReExport
			? DeclarationGroup.ReExport
			: isFunction
			? DeclarationGroup.Function
			: isClass
			? DeclarationGroup.Class
			: isEnum
			? DeclarationGroup.Enum
			: DeclarationGroup.unknown;

		if (groupKind === DeclarationGroup.unknown) {
			notices.groupKind(kind, this.wrappedItem, log.stackTracer());
		}

		return groupKind;
		function parseGroup(kind: ts.SyntaxKind, isArrowFunction: boolean) {
			const { SyntaxKind: syntax } = ts;

			const isClass =
				kind === syntax.ClassDeclaration ||
				kind === syntax.ClassExpression;
			const isVariable =
				(!isArrowFunction && kind === syntax.VariableDeclaration) ||
				kind === syntax.StringLiteral ||
				kind === syntax.ArrayLiteralExpression ||
				kind === syntax.ObjectLiteralExpression ||
				kind === syntax.CallExpression ||
				kind === syntax.NewExpression;

			const isFunction =
				isArrowFunction ||
				kind === syntax.FunctionExpression ||
				kind === syntax.ArrowFunction ||
				kind === syntax.FunctionDeclaration;
			const isModule =
				kind === syntax.ModuleDeclaration ||
				kind === syntax.NamespaceExport ||
				kind === syntax.NamespaceImport;

			const isType =
				kind === syntax.TypeAliasDeclaration ||
				kind === syntax.InterfaceDeclaration;

			const isReExport =
				kind === syntax.ImportSpecifier ||
				kind === syntax.ExportDeclaration;

			const isEnum = kind === syntax.EnumDeclaration;

			return {
				kind,
				isModule,
				isType,
				isReExport,
				isFunction,
				isClass,
				isVariable,
				isEnum,
			};
		}
	}

	public get checker() {
		return this.doxSourceFile.checker;
	}
	public get doxPackage() {
		return this.doxReference.parent;
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
	public get valueNode() {
		return this._valueNode;
	}
	private set valueNode(node: ts.Node) {
		this._valueNode = node;

		if (ts.isVariableDeclaration(node)) {
			const firstChild = node.parent.getChildAt(0)!;
			const { LetKeyword, ConstKeyword, VarKeyword } = ts.SyntaxKind;
			const { kind } = firstChild;
			this.flags.scopeKeyword =
				kind === LetKeyword
					? 'let'
					: kind === ConstKeyword
					? 'const'
					: kind === VarKeyword
					? 'var'
					: (undefined as never);
		}
	}
	public get tsWrap(): DoxReference['tsWrap'] {
		return this.parent.tsWrap;
	}
	public relate = (wrapped: TsWrapper, isTarget = false) => {
		if (!this.isSpecifierKind(wrapped.kind)) return;

		type routeKey = keyof typeof DoxDeclaration.relationshipRoutes;
		const key = ('relate' + ts.SyntaxKind[wrapped.kind]) as routeKey;
		const relateFunction = DoxDeclaration.relationshipRoutes[key];

		relateFunction
			? relateFunction.call(this, wrapped)
			: /* istanbul ignore next: soft error for debugging */
			  notices.report.call(this, wrapped, 'relate', isTarget);
	};
	private declare = (wrapped: TsWrapper, isTarget = false) => {
		if (!this.isSpecifierKind(wrapped.kind)) {
			this.valueNode = wrapped.tsNode;
			this.groupTsKind ??= wrapped.kind;
			return;
		}

		type routeKey = keyof typeof DoxDeclaration.declarationRoutes;
		const key = ('declare' + ts.SyntaxKind[wrapped.kind]) as routeKey;
		const declareFunction = DoxDeclaration.declarationRoutes[key];

		declareFunction
			? declareFunction.call(this, wrapped)
			: /* istanbul ignore next: soft error for debugging */
			  notices.report.call(this, wrapped, 'declare', isTarget);
	};
	private static relationshipRoutes = {
		relateExportAssignment(this: DoxDeclaration, wrapped: TsWrapper) {
			this.debug('relate ExportAssignment');

			const expression = (wrapped.tsNode as ts.ExportAssignment)
				.expression;

			if (this.isLiteral(expression)) return undefined;
			const expressionWrap = this.tsWrap(expression);
			const target =
				wrapped.target || expressionWrap.target || expressionWrap;
			target
				? this.relate(target, true)
				: /* istanbul ignore next: soft error for debugging */
				  this.notFound(wrapped, 'target');
		},
		relateExportDeclaration(this: DoxDeclaration, wrapped: TsWrapper) {
			this.debug('relate ExportDeclaration');

			const { targetFileName } = wrapped;
			const file = targetFileName && this.doxFilesMap.get(targetFileName);
			/* istanbul ignore next: soft error for debugging */
			if (!file) return this.fileNotFound(wrapped, targetFileName);

			const reExports: TsWrapper[] = [];
			file.declarationsMap.forEach((child) => {
				const { wrappedItem, name } = child;
				const { tsNode } = wrappedItem;
				const isExportDeclaration = ts.isExportDeclaration(tsNode);

				if (this.defaultStrings.includes(name)) return;
				isExportDeclaration
					? reExports.push(wrappedItem)
					: this.adopt(child);
			});
			reExports.forEach((reExport) => {
				this.relate(reExport, true);
			});
		},
		relateExportSpecifier(this: DoxDeclaration, wrapped: TsWrapper) {
			this.debug('relate ExportSpecifier');

			const { notFound, adopt, findChildDeclaration } = this;

			wrapped.moduleSpecifier
				? parseModule.call(this, wrapped.moduleSpecifier)
				: parseLocal.call(this);

			function parseModule(
				this: DoxDeclaration,
				expression: ts.Expression,
			) {
				//const { targetFileName: fileName } = tsWrap(expression);
				const child = findChildDeclaration(wrapped, expression);
				/* istanbul ignore next: soft error for debugging */
				if (!child) return;

				adopt(child);
			}

			function parseLocal(this: DoxDeclaration) {
				wrapped.target
					? this.relate(wrapped.target)
					: /* istanbul ignore next: soft error for debugging */
					  notFound(wrapped, 'target');
			}
		},
		relateImportClause(this: DoxDeclaration, wrapped: TsWrapper) {
			this.debug('relate ImportClause');

			const { findChildDeclaration, defaultStrings } = this;

			const child = findChildDeclaration(
				wrapped,
				wrapped.moduleSpecifier!,
				defaultStrings,
			);
			/* istanbul ignore next: soft error for debugging */
			if (!child) return;

			this.adopt(child);
		},
		/** eg, "export import foo = moduleDeclaration" */
		relateImportEqualsDeclaration(
			this: DoxDeclaration,
			wrapped: TsWrapper,
		) {
			this.debug('relate ImportEqualsDeclaration');
			wrapped.target
				? this.relate(wrapped.target)
				: /* istanbul ignore next: soft error for debugging */
				  this.notFound(wrapped, 'target');
		},
		relateImportSpecifier(this: DoxDeclaration, wrapped: TsWrapper) {
			this.debug('relate ImportSpecifier');

			const { findChildDeclaration } = this;
			const child = findChildDeclaration(
				wrapped,
				wrapped.moduleSpecifier!,
			);
			/* istanbul ignore next: soft error for debugging */
			if (!child) return;

			this.adopt(child);
		},
		relateModuleDeclaration(this: DoxDeclaration, wrapped: TsWrapper) {
			this.debug('relate ModuleDeclaration');

			wrapped.declaredModuleSymbols!.forEach((symbol) => {
				const wrapped = this.tsWrap(symbol);
				this.relate(wrapped);
			});
		},
		relateNamespaceExport(
			this: DoxDeclaration,
			wrapped: TsWrapper,
			skipNotice = false,
		) {
			!skipNotice && this.debug('relate NamespaceExport');

			const { targetFileName } = wrapped;

			const file =
				targetFileName &&
				this.doxReference.filesMap.get(targetFileName);
			/* istanbul ignore next: soft error for debugging */
			if (!file) return this.fileNotFound(wrapped, targetFileName);

			file.declarationsMap.forEach((child) => {
				const { wrappedItem } = child;
				const isExportDeclaration = ts.isExportDeclaration(
					wrappedItem.tsNode,
				);
				if (!isExportDeclaration) return this.adopt(child);

				this.relate(wrappedItem, true);
			});
		},
		relateNamespaceImport(this: DoxDeclaration, wrapped: TsWrapper) {
			this.debug('relate NamespaceImport');

			const aliasFnc =
				DoxDeclaration.relationshipRoutes.relateNamespaceExport;
			aliasFnc.call(this, wrapped, true);
		},
		/*
		relateBindingElement(this: DoxDeclaration, wrapped: TsWrapper) {},
		
		relateObjectLiteralExpression(
			this: DoxDeclaration,
			wrapped: TsWrapper,
		) {},
		*/
	};
	private static declarationRoutes = {
		declareExportAssignment(this: DoxDeclaration, wrapped: TsWrapper) {
			this.debug('declare ExportAssignment');

			this.flags.isDefault = true;
			const expression = (wrapped.tsNode as ts.ExportAssignment)
				.expression;

			if (this.isLiteral(expression)) {
				this.valueNode = expression.parent;
				this.groupTsKind = expression.kind;
				return;
			}

			const expressionWrap = this.tsWrap(expression);
			const target =
				wrapped.target || expressionWrap.target || expressionWrap;

			this.declare(target);
		},
		declareExportDeclaration(this: DoxDeclaration, wrapped: TsWrapper) {
			this.debug('declare ExportDeclaration');

			this.groupTsKind = this.wrappedItem.kind;
		},
		declareExportSpecifier(this: DoxDeclaration, wrapped: TsWrapper) {
			this.debug('declare ExportSpecifier');

			wrapped.target
				? this.declare(wrapped.target)
				: /* istanbul ignore next: soft error for debugging */
				  this.notFound(wrapped, 'target');
		},
		declareImportClause(this: DoxDeclaration, wrapped: TsWrapper) {
			this.debug('declare ImportClause');

			const target = wrapped.immediatelyAliasedSymbol;
			target
				? this.declare(this.tsWrap(target))
				: /* istanbul ignore next: soft error for debugging */
				  this.notFound(wrapped, 'immediatelyAliasedSymbol');
		},
		declareImportEqualsDeclaration(
			this: DoxDeclaration,
			wrapped: TsWrapper,
		) {
			this.debug('declare ImportEqualsDeclaration');

			wrapped.target
				? this.declare(wrapped.target)
				: /* istanbul ignore next: soft error for debugging */
				  this.notFound(wrapped, 'target');
		},
		declareImportSpecifier(this: DoxDeclaration, wrapped: TsWrapper) {
			this.debug('declare ImportSpecifier');

			const target = wrapped.immediatelyAliasedSymbol;
			target
				? this.declare(this.tsWrap(target))
				: /* istanbul ignore next: soft error for debugging */
				  this.notFound(wrapped, 'immediatelyAliasedSymbol');
		},
		declareModuleDeclaration(this: DoxDeclaration, wrapped: TsWrapper) {
			this.debug('declare ModuleDeclaration');

			const node = wrapped.tsNode as ts.ModuleDeclaration;
			this.valueNode = node;
			this.nameSpace = node.name.getText();
			this.groupTsKind = node.kind;

			wrapped.declaredModuleSymbols.forEach((symbol) => {
				const wrapped = this.tsWrap(symbol);
				const declarable =
					!this.isSpecifierKind(wrapped.kind) ||
					ts.isModuleDeclaration(wrapped.tsNode);

				declarable && this.declareLocal(symbol);
			});
		},
		declareNamespaceExport(
			this: DoxDeclaration,
			wrapped: TsWrapper,
			skipNotice = false,
		) {
			!skipNotice && this.debug('declare NamespaceExport');

			this.nameSpace = wrapped.name;
			this.groupTsKind = ts.SyntaxKind.ModuleDeclaration;
		},
		declareNamespaceImport(this: DoxDeclaration, wrapped: TsWrapper) {
			this.debug('declare NamespaceImport');

			const fnc = DoxDeclaration.declarationRoutes.declareNamespaceExport;
			fnc.call(this, wrapped, true);
		},
		/*
		declareBindingElement(this: DoxDeclaration, wrapped: TsWrapper) {
			const topNode = ts.walkUpBindingElementsAndPatterns(
				wrapped.tsNode as ts.BindingElement,
			);
			this.valueNode = topNode;
			log.info(ts.SyntaxKind[topNode.kind]);
			const { initializer } = topNode;
			log.info(ts.SyntaxKind[topNode.initializer!.kind]);
		},
		
		declareObjectLiteralExpression(
			this: DoxDeclaration,
			wrapped: TsWrapper,
		) {
			this.groupTsKind = ts.SyntaxKind.ModuleDeclaration;
			this.valueItem = wrapped;
		},
		*/
	};
	private adopt = (child: DoxDeclaration) => {
		if (this.children.has(child.name)) return;
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
		source: TsWrapper,
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
		const declaration = new DoxDeclaration(this, symbol, true);
		this.localDeclarationMap.set(name || declaration.name, declaration);

		return declaration;
	};
	/* istanbul ignore next: soft error for debugging */
	private fileNotFound = (wrapped: TsWrapper, fileName?: string) => {
		const message = `An invalid file was referenced: "${wrapped.nodeDeclarationText}" in`;
		fileName
			? this.notFound(wrapped, wrapped.fileName, message, 'warn')
			: this.notFound(wrapped, 'file');
	};
	private get notFound() {
		return notices.notFound.bind(this);
	}
	private get isArrowFunction() {
		const isVariable =
			this.valueNode && ts.isVariableDeclaration(this.valueNode);
		const type =
			isVariable && this.checker.getTypeAtLocation(this.valueNode!);
		return type ? !!type.getCallSignatures().length : false;
	}
}

const notices = {
	groupKind: function (
		tsKind: ts.SyntaxKind,
		wrapped: TsWrapper,
		stack: string,
	) {
		log.error(
			log.identifier(__filename),
			'Did not discover a group kind:',
			ts.SyntaxKind[tsKind],
			wrapped.report,
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
		function (
			this: DoxDeclaration,
			wrapped: TsWrapper,
			route: string,
			local: boolean,
		) {
			const errorMessage = `Did not ${route} a ${
				local ? 'localTargetNode' : 'node'
			} relationship`;
			deepReport.call(
				this,
				__filename,
				'error',
				errorMessage,
				wrapped,
				local,
			);
		},

	notFound:
		/* istanbul ignore next: soft error for debugging */
		function (
			this: DoxDeclaration,
			wrapped: TsWrapper,
			notFound: string,
			message = 'Did not find a',
			level = 'error' as Exclude<keyof typeof logLevels, 'silent'>,
		) {
			log[level](
				identifier(this),
				`[${wrapped.kindString}]`,
				message,
				`${notFound}`,
				level === 'error' ? wrapped.report : '',
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
	wrapped: TsWrapper,
	isLocalTarget: boolean,
) {
	log[logLevel](log.identifier(location), message, {
		filename: this.wrappedItem.fileName,
		sourceReport: this.wrappedItem.report,
		sourceDeclaration: loggerUtils.shortenString(
			this.wrappedItem.nodeDeclarationText,
			80,
		),

		targetReport: isLocalTarget ? wrapped.report : undefined,
		targetDeclaration: isLocalTarget
			? wrapped.nodeDeclarationText
			: undefined,
	});
}
