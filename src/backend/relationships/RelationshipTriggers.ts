import * as ts from 'typescript';
import * as dox from '../typedox';

export default class RelationshipTriggers {
	public relationshipTriggers: (() => void)[] = [];
	context: dox.lib.Context;
	symbol: ts.Symbol;
	checker: ts.TypeChecker;

	constructor(context: dox.lib.Context, symbol: ts.Symbol) {
		this.context = context;
		this.checker = this.context.checker;
		this.symbol = symbol;

		symbol.getDeclarations()?.forEach((declaration) => {
			/*
			if (ts.isExportSpecifier(declaration)) {
				const target =
					checker.getExportSpecifierLocalTargetSymbol(declaration);
				const targetType = checker.getTypeOfSymbol(target!);
				const targetNode = target!.valueDeclaration;

				dox.log.kind(targetType);
				dox.log.kind(target!);
			}
			
			const moduleSpecifier =
				dox.SourceFile.getModuleSpecifier(declaration);
			if (!moduleSpecifier) return;

			const exportSymbol = checker.getSymbolAtLocation(moduleSpecifier)!;
			const exportType = checker.getTypeOfSymbol(exportSymbol)!;
*/
			ts.isNamespaceExport(declaration)
				? this.registerNameSpaceExport(declaration)
				: ts.isExportSpecifier(declaration)
				? this.registerExportSpecifier(declaration)
				: ts.isExportDeclaration(declaration)
				? this.registerExportDeclaration(declaration)
				: ts.isModuleDeclaration(declaration)
				? this.registerModuleDeclaration(declaration)
				: (() => {
						dox.log.warn(
							'Declaration not implemented in dox.RelationshipTriggers',
							':',
							ts.SyntaxKind[declaration.kind],
						);
						dox.log.debug(declaration.parent.getText());
				  })();
		});
	}

	private registerNameSpaceImport(tsDeclaration: ts.ExportSpecifier) {
		const { getModuleSpecifier, getFilenameFromType } = dox.SourceFile;

		const exportType = this.checker.getTypeAtLocation(tsDeclaration.name);

		const targetFile = getFilenameFromType(exportType)!;
		const name = tsDeclaration.name.getText();

		const trigger = () => {
			const source = this.getDeclaration(name);

			const setRelations = (symbol: ts.Symbol) => {
				const name = symbol.getName();
				const target = this.getRemoteDeclaration(targetFile, name)!;

				source.children.set(name, target);
				target.parents.push(source);
			};

			exportType.getSymbol()?.exports?.forEach(setRelations);
		};
		this.relationshipTriggers.push(trigger);
	}
	private registerNameSpaceExport(tsDeclaration: ts.NamespaceExport) {
		const { getModuleSpecifier, getFilenameFromType } = dox.SourceFile;
		const moduleSpecifier = getModuleSpecifier(tsDeclaration)!;
		const exportType = this.checker.getTypeAtLocation(moduleSpecifier);
		const targetFile = getFilenameFromType(exportType)!;
		const name = tsDeclaration.name.getText();

		const trigger = () => {
			const source = this.getDeclaration(name);

			const setRelations = (symbol: ts.Symbol) => {
				const name = symbol.getName();
				const target = this.getRemoteDeclaration(targetFile, name)!;

				source.children.set(name, target);
				target.parents.push(source);
			};

			this.getRemoteSymbols(exportType).forEach(setRelations);
		};
		this.relationshipTriggers.push(trigger);
	}
	private registerModuleDeclaration(
		//tsDeclaration: ts.ExportSpecifier,
		moduleDeclaration: ts.ModuleDeclaration,
	) {
		const name = moduleDeclaration.name.getText(); //tsDeclaration.name.getText();

		const moduleType = this.checker.getTypeAtLocation(
			moduleDeclaration.name,
		);
		const trigger = () => {
			const source = this.getDeclaration(name);
			moduleType.getProperties().forEach((symbol) => {
				const newDeclaration = new dox.Declaration(
					this.context,
					symbol,
				);
				newDeclaration.parents.push(source);
				source.children.set(newDeclaration.name, newDeclaration);
			});
		};
		this.relationshipTriggers.push(trigger);
	}
	private registerExportSpecifier(tsDeclaration: ts.ExportSpecifier) {
		const { getLocalTargetSymbol: getLocalNamespace } = dox.SourceFile;

		const localNamespace = getLocalNamespace(this.checker, tsDeclaration);

		if (localNamespace && ts.isNamespaceImport(localNamespace))
			return this.registerNameSpaceImport(tsDeclaration);

		if (localNamespace && ts.isModuleDeclaration(localNamespace))
			return this.registerModuleDeclaration(
				//tsDeclaration,
				localNamespace,
			);

		const name = tsDeclaration.name.getText();
		const alias = tsDeclaration.propertyName?.getText();
		const { getModuleSpecifier, getFilenameFromType } = dox.SourceFile;
		const moduleSpecifier = getModuleSpecifier(tsDeclaration)!;
		const exportType = this.checker.getTypeAtLocation(moduleSpecifier)!;
		const targetFile = getFilenameFromType(exportType)!;

		const trigger = () => {
			const source = this.getDeclaration(name)!;
			const target = this.getRemoteDeclaration(
				targetFile,
				alias || name,
			)!;

			source.children.set(alias || name, target);
			target.parents.push(source);
		};
		this.relationshipTriggers.push(trigger);
	}
	private registerExportDeclaration(tsDeclaration: ts.ExportDeclaration) {
		const { getModuleSpecifier, getFilenameFromType } = dox.SourceFile;
		const moduleSpecifier = getModuleSpecifier(tsDeclaration)!;
		const exportType = this.checker.getTypeAtLocation(moduleSpecifier);
		const targetFile = getFilenameFromType(exportType)!;
		const trigger = () => {
			this.getRemoteSymbols(exportType)?.forEach((symbol) => {
				const name = symbol.getName();
				const source = this.getDeclaration(name);
				const target = this.getRemoteDeclaration(targetFile, name)!;

				source.children.set(name, target);
				target.parents.push(source);
			});
		};
		this.relationshipTriggers.push(trigger);
	}

	private getDeclaration(name: string) {
		const declarationsMap = this.context.sourceFile?.declarationsMap;
		return declarationsMap!.get(name)!;
	}
	private getRemoteSymbols(remoteType: ts.Type) {
		return remoteType.getProperties().filter((symbol) => {
			return !!symbol.valueDeclaration && symbol.name !== 'default';
		});
	}
	private getRemoteDeclaration(fileName: string, name: string) {
		const { filesMap } = this.context.package!;
		const remoteSourceFile = filesMap.get(fileName)!;
		return remoteSourceFile.declarationsMap.get(name);
	}
}
