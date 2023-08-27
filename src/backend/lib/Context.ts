import * as ts from 'typescript';
import * as dox from '../typedox';

export default class DoxContext {
	checker: ts.TypeChecker;
	program: ts.Program;
	config: ts.ParsedCommandLine;
	id: dox.lib.Id;
	package: dox.Package;
	reference?: dox.Reference;
	sourceFile?: dox.SourceFile;
	exportDeclaration?: dox.Declaration;

	constructor(
		checker: ts.TypeChecker,
		program: ts.Program,
		config: ts.ParsedCommandLine,
		id: dox.lib.Id,
		doxPackage: dox.Package,
		reference?: dox.Reference,
		sourceFile?: dox.SourceFile,
		exportDeclaration?: dox.Declaration,
	) {
		this.checker = checker;
		this.program = program;
		this.config = config;
		this.id = id;
		this.package = doxPackage;
		this.reference = reference;
		this.sourceFile = sourceFile;
		this.exportDeclaration = exportDeclaration;
	}
}
