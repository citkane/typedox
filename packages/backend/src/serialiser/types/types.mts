import ts from 'typescript';
import { DeclarationType, DoxDeclaration, log as log } from '../../typedox.mjs';

export function serialiseType(declaration: DoxDeclaration): DeclarationType {
	const { wrappedItem } = declaration;
	const { tsType } = wrappedItem;
	const { flags, aliasSymbol } = tsType;
	const { StringLiteral } = ts.TypeFlags;

	const type = aliasSymbol
		? serialiseAlias(declaration, aliasSymbol)
		: flags === StringLiteral
		? serialiseStringLiteral(tsType)
		: {
				kind: ts.TypeFlags[tsType.flags],
				name: 'unknown',
		  };

	return type;
}
function serialiseAlias(declaration: DoxDeclaration, symbol: ts.Symbol) {
	const name = symbol.name;
	const id = declaration.doxSourceFile.declarationsMap.get(name)?.id;
	return { kind: 'Alias', name, id };
}
function serialiseStringLiteral(type: ts.Type) {
	const { value } = type as any;
	return {
		kind: ts.TypeFlags[type.flags],
		name: 'string',
		valueString: value as string,
	};
}
