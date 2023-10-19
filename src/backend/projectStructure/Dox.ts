import ts from 'typescript';

/** get a handle for future jsconfig etc fun */
export const tsFileSpecifier = 'tsconfig';

let uid = 0;

export class Dox {
	public get id() {
		const id = uid;
		uid++;
		return id;
	}
	public isSpecifierKind = Dox.isSpecifierKind;
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
	public get isDoxProject() {
		return this.constructor.name === 'DoxProject';
	}
	public get isDoxPackage() {
		return this.constructor.name === 'DoxPackage';
	}
	public get isDoxReference() {
		return this.constructor.name === 'DoxReference';
	}
	public get isDoxDeclaration() {
		return this.constructor.name === 'DoxDeclaration';
	}
	public get isDoxSourceFile() {
		return this.constructor.name === 'DoxSourceFile';
	}
}
