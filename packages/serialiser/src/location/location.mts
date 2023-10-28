import { DeclarationGroup, DoxDeclaration } from '@typedox/core';
import { DeclarationLocation } from '../index.mjs';

export function makeDeclarationLocation(
	declaration: DoxDeclaration,
): DeclarationLocation {
	const { doxPackage, doxReference, group, name, flags } = declaration;
	const query = `${doxPackage.name}.${doxReference.name}.${
		DeclarationGroup[group]
	}.${flags.isDefault ? 'default' : name}`;
	const hash = '';
	return { query, hash };
}
