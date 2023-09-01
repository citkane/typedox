import * as ts from 'typescript';
import * as dox from '../typedox';

export class DoxContext {
	checker: ReturnType<ts.Program['getTypeChecker']>;
	tsProgram: ts.Program;
	tsConfig: ts.ParsedCommandLine;
	npmPackage: dox.NpmPackage;
	tsReference?: dox.TsReference;
	tsSourceFile?: dox.TsSourceFile;
	tsDeclaration?: dox.TsDeclaration;

	constructor(
		tsProgram: ts.Program,
		tsConfig: ts.ParsedCommandLine,
		npmPackage: dox.NpmPackage,
		tsReference?: dox.TsReference,
		tsSourceFile?: dox.TsSourceFile,
		tsDeclaration?: dox.TsDeclaration,
	) {
		this.tsProgram = tsProgram;
		this.checker = tsProgram.getTypeChecker();
		this.tsConfig = tsConfig;
		this.npmPackage = npmPackage;
		this.tsReference = tsReference;
		this.tsSourceFile = tsSourceFile;
		this.tsDeclaration = tsDeclaration;
	}
}
