import { assert } from 'chai';
import { declarationFactory } from '../../factories/declarationFactory';
import { factoryFolders } from '../../factories/tests.stubs.spec';
import {
	DeclarationSerialised,
	DoxDeclaration,
	DoxReference,
	DoxSourceFile,
	logger as log,
	logLevels,
} from '../../../../src/backend/typedox';
import { globalLogLevel } from '../../tests.backend.spec';
import { projectFactory } from '../../factories/projectFactory';
import { Serialised } from '../../../../src/backend/serialiser/Serialised';

const localLogLevel = logLevels.silent;
before(function () {
	log.setLogLevel(globalLogLevel || localLogLevel);
});

it('innitiates the base Serialiser class', function () {
	const declarations = getAllDeclarations();

	let object: Serialised;
	declarations.forEach((declaration) => {
		assert.doesNotThrow(() => {
			object = new Serialised(declaration);
		});
		assert.exists(object);
		assert.exists(object.serialised);
		['id', 'name', 'group', 'flags', 'location', 'type'].forEach((key) => {
			assert.exists(
				object!.serialised[key as keyof DeclarationSerialised],
				key,
			);
		});
	});
});

let muteFlag = false;
function getAllDeclarations() {
	return factoryFolders.reduce((accumulator, folder) => {
		const pack = projectFactory.specDoxPackage(
			folder,
			undefined,
			undefined,
			muteFlag,
		);
		muteFlag = true;
		const files = pack.doxReferences.reduce(
			getFiles,
			[] as DoxSourceFile[],
		);
		files.reduce(getDeclarations, accumulator);

		return accumulator;
	}, [] as DoxDeclaration[]);
}
function getFiles(accumulator: DoxSourceFile[], reference: DoxReference) {
	reference.filesMap.forEach((file) => accumulator.push(file));
	return accumulator;
}
function getDeclarations(accumulator: DoxDeclaration[], file: DoxSourceFile) {
	file.declarationsMap.forEach((declaration) =>
		accumulator.push(declaration),
	);
	return accumulator;
}
