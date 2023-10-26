import { DoxDeclaration } from '../typedox.mjs';

export const eventsApi = {
	/** accumulates the doxDeclarations which have no parents, ie. the root project declarations */
	'declarations.findRootDeclarations': declarationsFindRootDeclarations,
	'declaration.begin': declarationStaged,
	'declaration.declared': declarationStaged,
	'declaration.finished': declarationStaged,
};
function declarationsFindRootDeclarations(
	this: DoxDeclaration,
	accumulator: DoxDeclaration[],
) {
	if (!this.parents.size) accumulator.push(this);
}
function declarationStaged(declaration: DoxDeclaration) {}
