import { DeclarationSerialised, menuMeta } from '@typedox/serialiser';
import { SyntaxKind } from '../factories/factoryEnums.js';

export function syntaxKind(meta: menuMeta): SyntaxKind | undefined;
export function syntaxKind(declaration: DeclarationSerialised): SyntaxKind;
export function syntaxKind(
	declarationOrMeta: DeclarationSerialised | menuMeta,
) {
	return ((query) => (query ? parseInt(query.split('.')[2]) : undefined))(
		isDeclaration(declarationOrMeta)
			? declarationOrMeta.location.query
			: declarationOrMeta.location?.query,
	);
}

export function isExternal(meta: menuMeta): boolean;
export function isExternal(declaration: DeclarationSerialised): boolean;
export function isExternal(
	declarationOrMeta: DeclarationSerialised | menuMeta,
) {
	return ((isExternal) => isExternal)(
		isDeclaration(declarationOrMeta)
			? !!declarationOrMeta.flags.isExternal
			: !!declarationOrMeta.isExternal,
	);
}

export function isLocal(meta: menuMeta, kind?: SyntaxKind): boolean;
export function isLocal(
	declaration: DeclarationSerialised,
	kind?: SyntaxKind,
): boolean;
export function isLocal(
	declarationOrMeta: DeclarationSerialised | menuMeta,
	kind?: SyntaxKind,
) {
	return ((kind, local) => {
		return !kind && local
			? true
			: local &&
					kind &&
					!imports().includes(kind) &&
					!exports().includes(kind);
	})(
		kind || syntaxKind(declarationOrMeta),
		isDeclaration(declarationOrMeta)
			? !!declarationOrMeta.flags.isLocal
			: !!declarationOrMeta.isLocal,
	);
}

export function isImported(meta: menuMeta, kind?: SyntaxKind): boolean;
export function isImported(
	declaration: DeclarationSerialised,
	kind?: SyntaxKind,
): boolean;
export function isImported(
	declarationOrMeta: DeclarationSerialised | menuMeta,
	kind?: SyntaxKind,
) {
	return ((kind, notExternal) => {
		return kind && notExternal && imports().includes(kind);
	})(
		kind || syntaxKind(declarationOrMeta),
		isDeclaration(declarationOrMeta)
			? !declarationOrMeta.flags.isExternal
			: !declarationOrMeta.isExternal,
	);
}

export function isReexported(meta: menuMeta, kind?: SyntaxKind): boolean;
export function isReexported(
	declaration: DeclarationSerialised,
	kind?: SyntaxKind,
): boolean;
export function isReexported(
	declarationOrMeta: DeclarationSerialised | menuMeta,
	kind?: SyntaxKind,
) {
	return ((kind) => {
		return kind && exports().includes(kind);
	})(kind || syntaxKind(declarationOrMeta));
}

export function isEncapsulated(meta: menuMeta, kind?: SyntaxKind): boolean;
export function isEncapsulated(
	declaration: DeclarationSerialised,
	kind?: SyntaxKind,
): boolean;
export function isEncapsulated(
	declarationOrMeta: DeclarationSerialised | menuMeta,
	kind?: SyntaxKind,
) {
	return ((kind) => {
		return (
			!isImported(declarationOrMeta, kind) &&
			!isReexported(declarationOrMeta, kind) &&
			!isLocal(declarationOrMeta, kind) &&
			!isExternal(declarationOrMeta)
		);
	})(kind || syntaxKind(declarationOrMeta));
}

function isDeclaration(value: object): value is DeclarationSerialised {
	return 'children' in value && 'parents' in value;
}
const imports = () => [
	SyntaxKind.ImportClause,
	SyntaxKind.ImportEqualsDeclaration,
	SyntaxKind.ImportSpecifier,
	SyntaxKind.NamespaceImport,
];
const exports = () => [
	SyntaxKind.ExportAssignment,
	SyntaxKind.ExportDeclaration,
	SyntaxKind.ExportSpecifier,
	SyntaxKind.NamespaceExport,
];
