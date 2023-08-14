import {
	ExportDeclaration,
	Node,
	SyntaxKind,
	isExportDeclaration,
	isClassDeclaration,
	isImportDeclaration,
	isInterfaceDeclaration,
	isTypeAliasDeclaration,
	isExportAssignment,
	ExportAssignment,
} from 'typescript';
import Dox from './Dox';
import ExportDeclarationDox from './doxKinds/ExportDeclarationDox';
import DoxContext from './DoxContext';
import { DoxKind, declarationKinds, declarationMaps, fileMap } from './types';
import ExportMemberDox from './doxKinds/ExportMemberDox';
import { Logger } from './Logger';

const logger = new Logger();

export default class DoxPackage extends Dox {
	kind = DoxKind.Package;
	filesMap: fileMap = new Map();

	constructor(context: DoxContext, entryFileList: string[]) {
		super(context);
		super.package = this;

		this.addEntryFiles(entryFileList);

		this.forEachExportMember((member, declaration) => {
			if (!declaration.exportTargetFile) return;
			const targetMembers = [
				...this.filesMap
					.get(declaration.exportTargetFile)!
					.exports.values(),
			]
				.map((declaration) => declaration.membersMap.get(member.name)!)
				.filter((member) => !!member);

			targetMembers.forEach((targetMember) =>
				targetMember.parents.set(member.id, member),
			);
		});

		const members = [
			...(this.filesMap
				.get(
					'/home/michaeladmin/code/typedox/src/frontend/webComponents/Signature/signatureTypes/index.ts',
				)
				?.exports.values() || []),
		][0].membersMap;
		[...members.values()][0].getParentMembers();
	}

	private forEachExport(
		callBack: (declaration: ExportDeclarationDox) => void,
	) {
		this.filesMap.forEach((declarationMaps) => {
			declarationMaps.exports.forEach(callBack);
		});
	}
	private forEachExportMember(
		callBack: (
			member: ExportMemberDox,
			declaration: ExportDeclarationDox,
		) => void,
	) {
		this.forEachExport((declaration) =>
			declaration.membersMap.forEach((member) =>
				callBack(member, declaration),
			),
		);
	}
	public registerExportDeclaration(declaration: ExportDeclarationDox) {
		this.filesMap
			.get(declaration.exportSourceFile)!
			.exports.set(declaration.id, declaration);
	}
	public addEntryFile = (fileName?: string) =>
		fileName ? this.addEntryFiles([fileName]) : null;
	private addEntryFiles = (fileNames: string[]) => {
		const { declarationsContainer, parseForDeclarations } = DoxPackage;
		fileNames = this.deDupeFilelist(fileNames);
		const entrySources = this.getEntrySources(fileNames);
		const declarations = parseForDeclarations(
			entrySources,
			declarationsContainer(),
		);
		this.registerFilesWithSelf(fileNames);
		this.registerExportDeclarations(declarations.exports);
	};

	private static parseForDeclarations = (
		nodes: Node[],
		container: ReturnType<typeof this.declarationsContainer>,
	) => {
		const { exports, imports, classes, variables, types, interfaces } =
			container;
		nodes.forEach((node) => {
			if (isExportDeclaration(node)) {
				exports.push(node);
			} else if (isExportAssignment(node)) {
				exports.push(node);
			} else if (isImportDeclaration(node)) {
				imports.push(node);
			} else if (isClassDeclaration(node)) {
				classes.push(node);
			} else if (isInterfaceDeclaration(node)) {
				interfaces.push(node);
			} else if (isTypeAliasDeclaration(node)) {
				types.push(node);
			} else if (node.kind === SyntaxKind.FirstStatement) {
				variables.push(node);
			} else {
				logger.debug(
					`Ts kind ${'SyntaxKind[node.kind]'} was not registered as a declaration.`,
				);
				this.parseForDeclarations(node.getChildren(), container);
			}
		});

		return container;
	};

	private registerExportDeclarations = (
		exportDeclarations: (ExportDeclaration | ExportAssignment)[],
	) => {
		const context = { ...this.context, package: this };
		exportDeclarations.forEach((exportDeclaration) => {
			new ExportDeclarationDox(context, exportDeclaration);
		});
	};

	private registerFilesWithSelf(fileNames: string[]) {
		const { declarationsMap } = DoxPackage;
		fileNames.forEach((fileName) =>
			this.filesMap.set(fileName, declarationsMap()),
		);
	}

	private getEntrySources(fileList: string[]) {
		const { program } = this.context;
		return fileList
			.map((fileName) => program.getSourceFile(fileName)!)
			.filter((source, i) => {
				if (!source)
					logger.warn(
						`No source file was found for "${fileList[i]}"`,
					);

				return !!source;
			});
	}
	private deDupeFilelist(fileList: string[]) {
		return fileList.filter((file) => !this.filesMap.has(file));
	}

	private static declarationsContainer(): declarationKinds {
		return {
			exports: [],
			imports: [],
			classes: [],
			variables: [],
			types: [],
			interfaces: [],
		};
	}
	private static declarationsMap(): declarationMaps {
		return {
			exports: new Map(),
			imports: new Map(),
			classes: new Map(),
			variables: new Map(),
			types: new Map(),
			interfaces: new Map(),
		};
	}
}
