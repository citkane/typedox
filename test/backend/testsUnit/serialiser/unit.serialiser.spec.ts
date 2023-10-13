import { assert } from 'chai';
import {
	DoxProject,
	DoxPackage,
	DoxReference,
	DoxSourceFile,
	logger as log,
	logLevels,
	serialise,
} from '../../../../src/backend/typedox';
import { globalLogLevel } from '../../tests.backend.spec';
import { projectFactory } from '../../projectFactory';

const localLogLevel = logLevels.silent;
const localFactory = 'groups';

declare module 'mocha' {
	export interface Context {
		project: DoxProject;
		doxPackage: DoxPackage;
		sourceFile: DoxSourceFile;
		reference: DoxReference;
		referenceObject: ReturnType<
			(typeof serialise)['serialiseDoxReference']
		>;
		doxPackageObject: ReturnType<(typeof serialise)['serialiseDoxPackage']>;
		projectObject: ReturnType<(typeof serialise)['serialiseProject']>;
	}
}
before(function () {
	log.setLogLevel(globalLogLevel || localLogLevel);

	this.project = projectFactory.specDoxProject(localFactory);
	this.doxPackage = projectFactory.specDoxPackage(
		localFactory,
		0,
		this.project,
	);
	this.reference = projectFactory.specDoxReference(
		localFactory,
		0,
		this.doxPackage,
	);
	this.sourceFile = projectFactory.specDoxSourceFile(
		localFactory,
		this.reference,
		'index.ts',
	);
	assert.exists(this.project);
	assert.exists(this.doxPackage);
	assert.exists(this.reference);
	assert.exists(this.sourceFile);

	//this.reference.discoverFiles();
	//this.reference.discoverDeclarations();
	//this.reference.buildRelationships();

	this.referenceObject = this.reference.toObject;
	this.doxPackageObject = this.doxPackage.toObject;
	this.projectObject = this.project.toObject;
});
it('serialises a reference', function () {
	assert.exists(this.referenceObject);
	assert.doesNotThrow(() => JSON.stringify(this.referenceObject));
	assert.hasAllKeys(this.referenceObject, [
		'default',
		'namespaces',
		'classes',
		'functions',
		'enums',
		'variables',
	]);
	assert.hasAllKeys(this.referenceObject.namespaces, [
		'grandchildSpace',
		'childSpace',
		'emptyDeclaration',
		'rabbitHole',
		'default',
		'moduleDeclaration',
	]);
	assert.hasAllKeys(this.referenceObject.classes, ['Class', 'LocalClass']);
	assert.hasAllKeys(this.referenceObject.functions, [
		'localFunc',
		'func',
		'arrowFunc',
	]);
	assert.hasAllKeys(this.referenceObject.enums, ['enumerator']);
	assert.hasAllKeys(this.referenceObject.variables, [
		'grandchild',
		'localExport',
		'localDeclaration',
		'localAlias',
		'variable',
		'child',
		'stars',
		'defaultExport',
	]);
});
it('serialises a npm package', function () {
	assert.exists(this.doxPackageObject);
	assert.doesNotThrow(() => JSON.stringify(this.doxPackageObject));
	assert.hasAllKeys(this.doxPackageObject, ['name', 'version', 'references']);
	assert.hasAllKeys(this.doxPackageObject.references, ['groups']);
	assert.deepEqual(
		this.doxPackageObject.references.groups,
		this.referenceObject,
	);
	assert.equal(this.doxPackageObject.name, 'typedoxTesting');
	assert.equal(this.doxPackageObject.version, '0.0.0');
});
it('serialises a dox project', function () {
	assert.exists(this.projectObject);
	assert.doesNotThrow(() => JSON.stringify(this.projectObject));
	assert.hasAllKeys(this.projectObject, ['packages']);
	assert.hasAllKeys(this.projectObject.packages, ['typedoxTesting']);
	assert.deepEqual(
		this.projectObject.packages.typedoxTesting,
		this.doxPackageObject,
	);
});
