import ts from 'typescript';
import { DoxEvents } from '../events/DoxEvents.mjs';
import {
	DoxBranch,
	DoxDeclaration,
	DoxPackage,
	DoxProject,
	DoxReference,
	DoxSourceFile,
	events,
} from '../typedox.mjs';
import { log } from 'typedox/logger';

const __filename = log.getFilename(import.meta.url);

/** get a handle for future jsconfig etc fun */
export const tsFileSpecifier = 'tsconfig';
const EventEmitter = new DoxEvents();

let uid = 0;

export class Dox {
	public defaultStrings = ['default', 'export='];
	public get id() {
		const id = uid;
		uid++;
		return id;
	}
	public get eventCb() {
		return events.eventsApi;
	}
	public get once() {
		return EventEmitter.once;
	}
	public get on() {
		return EventEmitter.on;
	}
	public get off() {
		return EventEmitter.off;
	}
	public get emit() {
		return EventEmitter.emit;
	}
	public static isSpecifierKind = (kind: ts.SyntaxKind) => {
		const syntax = ts.SyntaxKind;

		const specifiers = [
			syntax.ExportAssignment,
			syntax.ExportDeclaration,
			syntax.ExportSpecifier,
			syntax.ImportClause,
			syntax.ImportEqualsDeclaration,
			syntax.ImportSpecifier,
			syntax.ModuleDeclaration,
			syntax.NamespaceExport,
			syntax.NamespaceImport,
			//syntax.BindingElement,
			//syntax.ObjectLiteralExpression,
		];

		return specifiers.includes(kind);
	};
	public isSpecifierKind = Dox.isSpecifierKind;
	protected isLiteral(expression: ts.Expression) {
		return !![
			ts.isLiteralExpression,
			ts.isArrayLiteralExpression,
			ts.isObjectLiteralExpression,
			ts.isStringLiteralOrJsxExpression,
			ts.isCallExpression,
			ts.isArrowFunction,
			ts.isFunctionExpression,
			ts.isNewExpression,
			ts.isClassExpression,
		].find((fnc) => fnc(expression));
	}
	protected isDoxProject = Dox.isDoxProject;
	protected isDoxPackage = Dox.isDoxPackage;
	protected isDoxReference = Dox.isDoxReference;
	protected isDoxDeclaration = Dox.isDoxDeclaration;
	protected isDoxSourceFile = Dox.isDoxSourceFile;
	protected isDoxBranch = Dox.isDoxBranch;
	protected isSymbol = Dox.isSymbol;
	protected isNode = Dox.isNode;
	protected isTypeNode = Dox.isTypeNode;
	protected isNodeOrSymbol = Dox.isNodeOrSymbol;

	public static isDoxProject(item: Dox): item is DoxProject {
		return item.constructor && item.constructor.name === 'DoxProject';
	}
	public static isDoxPackage(item: Dox): item is DoxPackage {
		return item.constructor && item.constructor.name === 'DoxPackage';
	}
	public static isDoxReference(item: Dox): item is DoxReference {
		return item.constructor && item.constructor.name === 'DoxReference';
	}
	public static isDoxDeclaration(item: Dox): item is DoxDeclaration {
		return item.constructor && item.constructor.name === 'DoxDeclaration';
	}
	public static isDoxSourceFile(item: Dox): item is DoxSourceFile {
		return item.constructor && item.constructor.name === 'DoxSourceFile';
	}
	public static isDoxBranch(item: Dox): item is DoxBranch {
		return item.constructor && item.constructor.name === 'DoxBranch';
	}
	public static isSymbol(item: any): item is ts.Symbol {
		return item.constructor && item.constructor.name === 'SymbolObject';
	}
	public static isNode(item: any): item is ts.Node {
		if (!item.constructor) return false;
		return (
			item.constructor.name === 'NodeObject' ||
			item.constructor.name === 'IdentifierObject'
		);
	}
	public static isTypeNode(item: any): item is ts.Type {
		return item.constructor && item.constructor.name === 'TypeObject';
	}
	public static isNodeOrSymbol(item: any): item is ts.Node | ts.Symbol {
		return Dox.isSymbol(item) || Dox.isNode(item);
	}

	protected declared = Dox.declared;
	public static declared(symbol: ts.Symbol) {
		const accumulator = {
			nodes: undefined,
			typeAlias: undefined,
			fileName: undefined,
		} as {
			nodes: ts.Node[] | undefined;
			typeAlias: ts.TypeAliasDeclaration | undefined;
			fileName: string | undefined;
		};

		const { declarations } = symbol;

		if (!declarations) return accumulator;

		const declared = declarations.reduce((accumulator, declaration) => {
			accumulator.fileName ??= declaration.getSourceFile().fileName;
			if (ts.isTypeAliasDeclaration(declaration)) {
				if (accumulator.typeAlias)
					log.error(
						log.identifier(__filename),
						`Duplicate type encountered: ${symbol.name}`,
					);
				accumulator.typeAlias = declaration;
			} else {
				accumulator.nodes ??= [];
				accumulator.nodes.push(declaration);
			}
			return accumulator;
		}, accumulator);

		return declared;
		/*
		const node = declarations.find((declared) => !ts.isTypeNode(declared));
		const type = declarations.find((declared) => ts.isTypeNode(declared));
		return { node, type };
		*/
	}
}
