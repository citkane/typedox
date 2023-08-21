import * as ts from 'typescript';
import * as dox from '../typedox';

export default class RelationshipTriggers {
	public relationshipTriggers: (() => void)[] = [];
	public childFiles: string[] = [];
	context: dox.lib.Context;
	constructor(context: dox.lib.Context, exportSymbol: ts.Symbol) {
		this.context = context;
		exportSymbol.getDeclarations()?.forEach((declaration) => {
			ts.isNamespaceExport(declaration)
				? this.nameSpaceExport(declaration)
				: ts.isExportSpecifier(declaration)
				? this.exportSpecifier(declaration)
				: ts.isExportDeclaration(declaration)
				? this.exportDeclaration(declaration)
				: (() => {
						dox.log.warn(
							'Declaration not implemented',
							':',
							ts.SyntaxKind[declaration.kind],
						);
						dox.log.debug(declaration.parent.getText());
				  })();
		});
	}

	private nameSpaceExport(tsDeclaration: ts.NamespaceExport) {
		const target = tsDeclaration.parent.moduleSpecifier!;
		const { targetFile, targetType } = this.targetHelper(target);
		this.childFiles.push(targetFile);
		const name = tsDeclaration.name.getText();
		const trigger = () => {
			const declaration = this.getDeclaration(name);
			this.getRemoteSymbols(targetType).forEach((symbol) => {
				const name = symbol.getName();
				const remoteDeclaration =
					this.getRemoteDeclarationsMap(symbol).get(name)!;

				declaration.children.set(name, remoteDeclaration);
				remoteDeclaration.parents.push(declaration);
			});
		};
		this.relationshipTriggers.push(trigger);
	}

	private exportSpecifier(tsDeclaration: ts.ExportSpecifier) {
		const target = tsDeclaration.parent.parent.moduleSpecifier;
		if (!target) return;

		const { targetFile, targetType } = this.targetHelper(target);
		this.childFiles.push(targetFile);
		const name = tsDeclaration.name.getText();
		const alias = tsDeclaration.propertyName?.getText();
		const trigger = () => {
			const declaration = this.getDeclaration(name)!;
			const map = this.getRemoteDeclarationsMap(targetType.getSymbol()!);
			const remoteDeclaration = map.get(alias || name)!;

			declaration.children.set(alias || name, remoteDeclaration);
			remoteDeclaration.parents.push(declaration);
		};
		this.relationshipTriggers.push(trigger);
	}
	private exportDeclaration(declaration: ts.ExportDeclaration) {
		const target = declaration.moduleSpecifier!;
		const { targetFile, targetType } = this.targetHelper(target);
		this.childFiles.push(targetFile);
		const trigger = () => {
			this.getRemoteSymbols(targetType).forEach((symbol) => {
				const name = symbol.getName();
				const declaration = this.getDeclaration(name);
				const remoteDeclaration =
					this.getRemoteDeclarationsMap(symbol).get(name)!;

				declaration.children.set(name, remoteDeclaration);
				remoteDeclaration.parents.push(declaration);
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
			/*
			if (!symbol.valueDeclaration)
				dox.log.info(symbol.declarations![0].getText());
			*/
			return !!symbol.valueDeclaration && symbol.name !== 'default';
		});
	}
	private getRemoteDeclarationsMap(remoteSymbol: ts.Symbol) {
		const remoteSourceFile = this.context.package!.filesMap.get(
			remoteSymbol.valueDeclaration!.getSourceFile().fileName!,
		)!;
		return remoteSourceFile.declarationsMap;
	}
	/*
	private parseReferencedExport(
		declaration: dox.referencedExport,
		relationshipTriggers: (() => void)[],
		context: dox.lib.Context,
	) {
		let targetFile: string | undefined, targetType: ts.Type;
		if (ts.isNamespaceExport(declaration)) {
			const target = declaration.parent.moduleSpecifier!;
			({ targetFile, targetType } = this.targetHelper(target));

			//context.package!.addEntryFile(targetFile);

			relationshipTriggers.push(() => {
				new dox.NamespaceExport(context, declaration, targetType);
			});
		}
		if (ts.isExportSpecifier(declaration)) {
			const target = declaration.parent.parent.moduleSpecifier;
			const { targetFile, targetType } = !!target
				? this.targetHelper(target!)
				: { targetFile: undefined, targetType: undefined };
			if (!!targetFile)
				//if (!!targetFile) context.package!.addEntryFile(targetFile);

				relationshipTriggers.push(() => {
					new dox.ExportSpecifier(context, declaration, targetType);
				});
		}
		if (ts.isExportDeclaration(declaration)) {
			const target = declaration.moduleSpecifier!;
			const { targetFile, targetType } = this.targetHelper(target);
			//context.package!.addEntryFile(targetFile);

			relationshipTriggers.push(() => {
				new dox.ExportDeclaration(context, declaration, targetType);
			});
		}

		if (!!targetFile) this.childFiles.push(targetFile);
	}
*/
	/**
	 *A convenience function.
	 * @param exportExpression
	 * @param context
	 * @returns The export target as a filePath string and ts.Type
	 */
	private targetHelper = (exportExpression: ts.Expression) => {
		const { checker } = this.context;
		const exportSymbol = checker.getSymbolAtLocation(exportExpression)!;
		const targetType = checker.getTypeOfSymbol(exportSymbol);
		const targetFile =
			exportSymbol.valueDeclaration!.getSourceFile().fileName;

		return {
			targetFile,
			targetType,
		};
	};
}
