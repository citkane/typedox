import * as stubs from '../../tests.stubs.spec';
import { assert } from 'chai';

import {
	DoxProject,
	NpmPackage,
	TsReference,
	TsSourceFile,
	logger as log,
	logLevels,
	serialise,
} from '../../../../src/backend/typedox';

let project: DoxProject,
	npmPackage: NpmPackage,
	sourceFile: TsSourceFile,
	reference: TsReference;

let referenceObject: ReturnType<(typeof serialise)['serialiseTsReference']>,
	npmPackageObject: ReturnType<(typeof serialise)['serialiseNpmPackage']>,
	projectObject: ReturnType<(typeof serialise)['serialiseProject']>;

before(function () {
	log.setLogLevel(logLevels.error);

	project = stubs.projectFactory.specProject();

	npmPackage = stubs.projectFactory.specNpmPackage(0, project);
	reference = stubs.projectFactory.specReference(0, npmPackage);
	sourceFile = stubs.projectFactory.specTsSourceFile(reference, 'index.ts');

	reference.discoverFiles();
	reference.discoverDeclarations();
	reference.buildRelationships();
});
it('serialises a reference', function () {
	referenceObject = serialise.serialiseTsReference(reference);
	assert.exists(referenceObject);
	assert.doesNotThrow(() => JSON.stringify(referenceObject));
	assert.hasAllKeys(referenceObject, [
		'default',
		'namespaces',
		'classes',
		'functions',
		'enums',
		'variables',
	]);
	assert.hasAllKeys(referenceObject.namespaces, [
		'grandchildSpace',
		'emptySpace',
		'childSpace',
		'moduleDeclaration',
		'emptyDeclaration',
	]);
	assert.hasAllKeys(referenceObject.classes, ['Class', 'LocalClass']);
	assert.hasAllKeys(referenceObject.functions, [
		'localFunc',
		'func',
		'arrowFunc',
	]);
	assert.hasAllKeys(referenceObject.enums, ['enumerator']);
	assert.hasAllKeys(referenceObject.variables, [
		'grandchild',
		'localExport',
		'localDeclaration',
		'localAlias',
		'variable',
		'greatGrandchild',
		'child',
		'stars',
	]);
});
it('serialises a npm package', function () {
	npmPackageObject = serialise.serialiseNpmPackage(npmPackage);
	assert.exists(npmPackageObject);
	assert.doesNotThrow(() => JSON.stringify(npmPackageObject));
	assert.hasAllKeys(npmPackageObject, ['name', 'version', 'references']);
	assert.hasAllKeys(npmPackageObject.references, ['groups']);
	assert.deepEqual(npmPackageObject.references.groups, referenceObject);
	assert.equal(npmPackageObject.name, 'typedoxTesting');
	assert.equal(npmPackageObject.version, '0.0.0');
});
it('serialises a dox project', function () {
	projectObject = serialise.serialiseProject(project);
	assert.exists(projectObject);
	assert.doesNotThrow(() => JSON.stringify(projectObject));
	assert.hasAllKeys(projectObject, ['packages']);
	assert.hasAllKeys(projectObject.packages, ['typedoxTesting']);
	assert.deepEqual(projectObject.packages.typedoxTesting, npmPackageObject);
});
