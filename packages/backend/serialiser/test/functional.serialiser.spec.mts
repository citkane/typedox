import { assert } from 'chai';
import { DoxDeclaration, DoxReference, DoxSourceFile } from '@typedox/core';
import { doxStub, projectFactory } from '@typedox/test';
import { log, logLevels } from '@typedox/logger';
import { DeclarationSerialised, Serialised } from '@typedox/serialiser';

const localLogLevel = logLevels.silent;

export default function () {
	before(function () {
		log.setLogLevel(doxStub.globalLogLevel || localLogLevel);
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
			['id', 'name', 'category', 'flags', 'location', 'type'].forEach(
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
	return doxStub.factoryFolders.reduce((accumulator, folder) => {
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
