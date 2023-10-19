import {
	DeclarationGroup,
	DeclarationLocation,
	DoxDeclaration,
	logger as log,
} from '../../typedox';

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
