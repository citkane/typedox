import { assert } from 'chai';
import {
	DeclarationSerialised,
	DoxDeclaration,
	DoxReference,
	DoxSourceFile,
	log,
	logLevels,
	serialiser,
} from 'typedox';
import { factoryFolders } from '../../factories/tests.stubs.mjs';
import { globalLogLevel } from '../../tests.backend.spec.mjs';
import { projectFactory } from '../../factories/projectFactory.mjs';

const localLogLevel = logLevels.silent;
const { Serialised } = serialiser;

export default function () {
	before(function () {
		log.setLogLevel(globalLogLevel || localLogLevel);
	});

	it('innitiates the base Serialiser class', function () {
		const declarations = getAllDeclarations();

		let object: serialiser.Serialised;
		declarations.forEach((declaration) => {
			assert.doesNotThrow(() => {
				object = new Serialised(declaration);
			});
			assert.exists(object);
			assert.exists(object.serialised);
			['id', 'name', 'group', 'flags', 'location', 'type'].forEach(
				(key) => {
					assert.exists(
						object!.serialised[key as keyof DeclarationSerialised],
						key,
					);
				},
			);
		});
	});
}
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
