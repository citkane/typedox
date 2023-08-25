import * as ts from 'typescript';
import * as dox from '../typedox';

export default class FileFinder {
	public childFiles: string[] = [];
	context: dox.lib.Context;

	constructor(context: dox.lib.Context, exportSymbol: ts.Symbol) {
		this.context = context;
		const { checker } = this.context;
		const {
			getLocalTargetSymbol: getLocalNamespace,
			getFilenameFromType,
			getModuleSpecifier,
		} = dox.SourceFile;
		exportSymbol.getDeclarations()?.forEach((declaration) => {
			const localNamespace = ts.isExportSpecifier(declaration)
				? getLocalNamespace(checker, declaration)
				: undefined;

			if (localNamespace && ts.isNamespaceImport(localNamespace)) {
				const type = checker.getTypeAtLocation(localNamespace);
				this.push(getFilenameFromType(type)!);
			}

			const moduleSpecifier = getModuleSpecifier(declaration);
			if (!moduleSpecifier) return;
			const exportSymbol = checker.getSymbolAtLocation(moduleSpecifier);
			const targetFile = exportSymbol?.valueDeclaration?.getSourceFile();
			if (!targetFile) return;

			this.push(targetFile.fileName);
		});
	}
	private push(fileName: string) {
		if (this.childFiles.indexOf(fileName) < 0)
			this.childFiles.push(fileName);
	}
}
