import { ExportSpecifier, Symbol, SyntaxKind, Type } from 'typescript';
import Dox from '../Dox';
import DoxContext from '../DoxContext';
import { DoxKind } from '../types';
import { Logger } from '../Logger';

const logger = new Logger();

export default class ExportMemberDox extends Dox {
	private value: ExportSpecifier | Symbol;
	parents: Map<number, ExportMemberDox> = new Map();
	kind = DoxKind.ExportMember;
	name: string;
	alias?: string;
	symbol: Symbol;
	constructor(
		context: DoxContext,
		value: ExportSpecifier | Symbol,
		type?: Type,
	) {
		super(context);

		this.value = value;
		const { getNames, getSymbol } = ExportMemberDox;

		switch (this.isExportSpecifier) {
			case true:
				const specifier = value as ExportSpecifier;
				const { name, alias } = getNames(specifier);
				this.name = name;
				this.alias = alias;
				this.symbol = getSymbol(this.name, type!, this.alias);
				break;
			case false:
				const symbol = value as Symbol;
				this.name = symbol.getName();
				this.alias = undefined;
				this.symbol = symbol;
				break;
		}
		this.exportDeclaration!.registerMember(this);
	}
	getParentMembers = (
		parentMembers: Map<number, ExportMemberDox> = new Map(),
	) => {
		this.parents.forEach((parent) => {
			if (!parentMembers.has(parent.id))
				parentMembers.set(parent.id, parent);
		});

		return parentMembers;
	};
	private get isExportSpecifier() {
		return (
			'kind' in this.value &&
			(this.value as ExportSpecifier).kind === SyntaxKind.ExportSpecifier
		);
	}
	private static getSymbol(name: string, type: Type, alias?: string) {
		let symbol = type.getProperty(name);
		symbol = !!symbol ? symbol : type.getProperty(alias!);
		if (!symbol)
			logger.error(
				`Could not find property "${name}" ${
					!!alias ? 'with alias "' + alias + '"' : ''
				} in ${type.symbol.getName()}`,
			);
		return symbol!;
	}
	private static getNames(specifier: ExportSpecifier) {
		const name = specifier.getFirstToken()!.getText();
		const nameAlias = specifier.getLastToken()!.getText();
		return {
			name,
			alias: nameAlias === name ? undefined : nameAlias,
		};
	}
}
