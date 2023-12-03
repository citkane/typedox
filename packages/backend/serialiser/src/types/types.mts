import ts from 'typescript';
import { DeclarationType } from '../index.mjs';
import { DoxDeclaration } from '@typedox/core';

const escape = ts.escapeLeadingUnderscores;

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
	return { kind: 'Alias', name };
}
function serialiseStringLiteral(type: ts.Type) {
	const { value } = type as any;
	return {
		kind: ts.TypeFlags[type.flags],
		name: 'string',
		valueString: value as string,
	};
}
