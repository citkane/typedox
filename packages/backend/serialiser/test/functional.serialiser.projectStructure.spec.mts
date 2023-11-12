import { assert } from 'chai';

import {
	DoxProject,
	DoxPackage,
	DoxReference,
	DoxSourceFile,
} from '@typedox/core';
import { doxStub, projectFactory } from '@typedox/test';
import { log, logLevels } from '@typedox/logger';
import {
	serialiseReference,
	serialisePackage,
	serialiseProject,
} from '@typedox/serialiser';

const localLogLevel = logLevels.silent;
const localFactory = 'categories';

declare module 'mocha' {
	export interface Context {
		doxProject: DoxProject;
		doxPackage: DoxPackage;
		sourceFile: DoxSourceFile;
		doxReference: DoxReference;
		serialisedReference: ReturnType<typeof serialiseReference>;
		serialisedPackage: ReturnType<typeof serialisePackage>;
		serialisedProject: ReturnType<typeof serialiseProject>;
	}
}
export default function () {
	before(function () {
		log.setLogLevel(doxStub.globalLogLevel || localLogLevel);

		this.doxProject = projectFactory.specDoxProject(localFactory);
		this.doxPackage = projectFactory.specDoxPackage(
			localFactory,
			0,
			this.doxProject,
		);
		this.doxReference = projectFactory.specDoxReference(
			localFactory,
			0,
			this.doxPackage,
		);
		this.sourceFile = projectFactory.specDoxSourceFile(
			localFactory,
			this.doxReference,
			'index.ts',
		);
		assert.exists(this.doxProject);
		assert.exists(this.doxPackage);
		assert.exists(this.doxReference);
		assert.exists(this.sourceFile);

		this.serialisedReference = serialiseReference(this.doxReference);
		this.serialisedPackage = serialisePackage(this.doxPackage);
		this.serialisedProject = serialiseProject(this.doxProject);
	});
	it('serialises a reference', function () {
		assert.exists(this.serialisedReference);
		assert.doesNotThrow(() => JSON.stringify(this.serialisedReference));
		assert.hasAllKeys(this.serialisedReference, [
			'namespaces',
			'classes',
			'functions',
			'enums',
			'variables',
			'category',
		]);
		assert.hasAllKeys(this.serialisedReference!.namespaces, [
			'grandchildSpace',
			'childSpace',
			'emptyDeclaration',
			'rabbitHole',
			'default',
			'moduleDeclaration',
		]);
		assert.hasAllKeys(this.serialisedReference!.classes, [
			'Class',
			'LocalClass',
		]);
		assert.hasAllKeys(this.serialisedReference!.variables, [
			'grandchild',
			'localExport',
			'localDeclaration',
			'localAlias',
			'variable',
			'child',
			'stars',
			'defaultExport',
			'greatGrandchild',
			'nsExport',
		]);
		assert.hasAllKeys(this.serialisedReference!.functions, [
			'localFunc',
			'func',
			'arrowFunc',
		]);
		assert.hasAllKeys(this.serialisedReference!.enums, ['enumerator']);
	});
	it('serialises a npm package', function () {
		assert.exists(this.serialisedPackage);

		assert.doesNotThrow(() => JSON.stringify(this.serialisedPackage));
		assert.hasAllKeys(this.serialisedPackage, [
			'name',
			'version',
			'references',
			'category',
			'workspaces',
		]);
		assert.hasAllKeys(this.serialisedPackage.references, ['categories']);
		const ref = this.serialisedReference;
		const packageRef = this.serialisedPackage.references['categories'];

		assert.deepEqualExcludingEvery(packageRef!, ref!, [
			'id' as any,
			'parents',
		]);
		assert.equal(this.serialisedPackage.name, 'typedoxTestingCategories');
		assert.equal(this.serialisedPackage.version, '0.0.0');
	});
	it('serialises a dox project', function () {
		assert.exists(this.serialisedProject);
		assert.doesNotThrow(() => JSON.stringify(this.serialisedProject));
		assert.hasAllKeys(this.serialisedProject, ['packages']);
		assert.hasAllKeys(this.serialisedProject.packages, [
			'typedoxTestingCategories',
		]);
		assert.deepEqualExcludingEvery(
			this.serialisedProject.packages.typedoxTestingCategories,
			this.serialisedPackage,
			['id' as any, 'parents'],
		);
	});
}
