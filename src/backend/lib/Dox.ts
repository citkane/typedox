import * as ts from 'typescript';
import * as dox from '../typedox';
import Logger from './Logger';

export class Dox extends Logger {
	protected context: dox.lib.Context;
	checker: ts.TypeChecker;
	protected reference?: dox.Reference;
	protected package: dox.Package;
	sourceFile?: dox.SourceFile;
	fileName?: string;
	protected exportDeclaration?: dox.Declaration;
	id: number;
	constructor(context: dox.lib.Context) {
		super();
		this.context = context;
		this.checker = context.checker;
		this.id = context.id.uid;
		this.package = context.package;
		this.reference = context.reference;
		this.sourceFile = context.sourceFile;
		this.fileName = context.sourceFile?.fileName;
		this.exportDeclaration = context.exportDeclaration;
	}

	public getter = (item: dox.whatIsIt) =>
		new dox.lib.WhatIsIt(this.checker, item);
	public static canBeIgnored = (node: ts.Node) =>
		ts.isEnumDeclaration(node) ||
		ts.isClassDeclaration(node) ||
		ts.isVariableDeclaration(node) ||
		ts.isSourceFile(node) ||
		ts.isFunctionDeclaration(node);

	public static fullReport(
		logLevel: keyof typeof dox.logLevels,
		self: dox.Declaration | dox.lib.Relationships,
		classDescription: string,
		message: string,
		get: dox.lib.WhatIsIt,
		isLocalTarget: boolean,
	) {
		self[logLevel](classDescription, message, {
			filename: self.get.fileName,
			sourceReport: self.get.report,
			sourceDeclaration: self.get.nodeDeclarationText,
			targetReport: isLocalTarget ? get.report : undefined,
			targetDeclaration: isLocalTarget
				? get.nodeDeclarationText
				: undefined,
		});
	}
}
