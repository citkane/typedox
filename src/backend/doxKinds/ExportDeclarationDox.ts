import {
	ExportAssignment,
	ExportDeclaration,
	isExportDeclaration,
	isNamedExports,
	isNamespaceExport,
	NamedExports,
	NamespaceExport,
	Symbol,
	Type,
} from 'typescript';
import { DoxKind, memberMap } from '../types';

import Dox from '../Dox';
import DoxContext from '../DoxContext';
import ExportMemberDox from './ExportMemberDox';

export default class ExportDeclarationDox extends Dox {
	kind = DoxKind.ExportDeclaration;
	parentFiles: string[] = [];
	private declaration: ExportDeclaration | ExportAssignment;
	private moduleSymbol?: Symbol;

	nameSpace: string;
	exportSourceFile: string;
	exportTargetFile?: string;
	membersMap: memberMap = new Map();

	constructor(
		context: DoxContext,
		declaration: ExportDeclaration | ExportAssignment,
	) {
		super(context);

		const { getNameSpace, getExportTargetFile } = ExportDeclarationDox;

		this.declaration = declaration;
		this.exportSourceFile = declaration.getSourceFile().fileName;
		this.moduleSymbol = this.getModuleSymbol();
		this.exportTargetFile = getExportTargetFile(this.moduleSymbol);
		this.nameSpace = getNameSpace(declaration);
		const { exportTargetFile, moduleType, sourceType } = this;
		const type = moduleType || sourceType;

		this.makeMembers(type);
		this.package.registerExportDeclaration(this);

		this.package.addEntryFile(exportTargetFile);
	}
	public registerMember(member: ExportMemberDox) {
		this.membersMap.set(member.name, member);
	}
	private makeMembers(type: Type) {
		const namedExport = this.namedExport;
		const context = { ...this.context, exportDeclaration: this };
		const members = !!namedExport
			? namedExport.elements.map(
					(specifier) =>
						new ExportMemberDox(context, specifier, type),
			  )
			: type
					.getProperties()
					.map((symbol) => new ExportMemberDox(context, symbol));
	}

	private get namedExport() {
		return this.declaration
			.getChildren()
			.find((node) => isNamedExports(node)) as NamedExports;
	}
	private getModuleSymbol() {
		if (!('moduleSpecifier' in this.declaration)) return undefined;
		const { checker } = this.context;
		const { moduleSpecifier } = this.declaration;
		return checker.getSymbolAtLocation(moduleSpecifier!);
	}
	private get moduleType() {
		const { checker } = this.context;
		const symbol = this.moduleSymbol;
		return symbol ? checker.getTypeOfSymbol(symbol) : undefined;
	}
	private get sourceType() {
		const { checker } = this.context;
		const symbol = checker.getSymbolAtLocation(
			this.declaration.parent.getSourceFile(),
		);
		return checker.getTypeOfSymbol(symbol!);
	}

	private static getExportTargetFile = (module?: Symbol) => {
		if (!module) return undefined;
		return module.valueDeclaration?.getSourceFile().fileName;
	};

	private static getNameSpace = (
		declaration: ExportDeclaration | ExportAssignment,
	) => {
		const node = declaration
			.getChildren()
			.find((node) => isNamespaceExport(node)) as NamespaceExport;
		return node?.name.getText();
	};
}
