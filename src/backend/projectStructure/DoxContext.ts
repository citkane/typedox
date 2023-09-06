import * as dox from '../typedox';
import * as ts from 'typescript';

const log = dox.logger;

/**
 * A helper class for registering re-usable contexts on some project structure levels:
 *
 * &emsp;DoxProject\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- NpmPackage[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- ***TsReference***[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- ***TsSourceFile***[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- ***TsDeclaration***[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- Branch[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...***TsDeclaration***...
 *
 */
export default class DoxContext {
	tsProgram: ts.Program;
	tsConfig: ts.ParsedCommandLine;
	npmPackage: dox.NpmPackage;
	tsReference?: dox.TsReference;
	tsSourceFile?: dox.TsSourceFile;
	tsDeclaration?: dox.TsDeclaration;

	constructor(context: {
		tsProgram: ts.Program;
		tsConfig: ts.ParsedCommandLine;
		npmPackage: dox.NpmPackage;
	});
	constructor(context: DoxContext) {
		this.tsProgram = context.tsProgram;
		this.tsConfig = context.tsConfig;
		this.npmPackage = context.npmPackage;
		this.tsReference = context.tsReference;
		this.tsSourceFile = context.tsSourceFile;
		this.tsDeclaration = context.tsDeclaration;
	}
	protected get checker() {
		return this.tsProgram.getTypeChecker();
	}
	protected tsWrap = (item: dox.whatIsIt) =>
		new dox.TscWrapper(this.checker, item);
	protected registerTsReferenceContext = (tsReference: dox.TsReference) =>
		new DoxContext({ ...this, tsReference });
	protected registerTsSourceFileContext = (tsSourceFile: dox.TsSourceFile) =>
		new DoxContext({ ...this, tsSourceFile });
	protected registerTsDeclarationContext = (
		tsDeclaration: dox.TsDeclaration,
	) => new DoxContext({ ...this, tsDeclaration });
}

export const isSpecifierKind = (kind: ts.SyntaxKind) => {
	const {
		NamespaceExport,
		NamespaceImport,
		ModuleDeclaration,
		ExportDeclaration,
		ExportSpecifier,
		ExportAssignment,
		ImportClause,
		ImportSpecifier,
	} = ts.SyntaxKind;
	const specifiers = [
		NamespaceExport,
		NamespaceImport,
		ModuleDeclaration,
		ExportDeclaration,
		ExportSpecifier,
		ExportAssignment,
		ImportClause,
		ImportSpecifier,
	];
	return specifiers.includes(kind);
};
