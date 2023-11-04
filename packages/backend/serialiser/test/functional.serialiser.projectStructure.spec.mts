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
	serialiseDoxReference,
	serialiseDoxPackage,
	serialiseDoxProject,
} from '@typedox/serialiser';

const localLogLevel = logLevels.silent;
const localFactory = 'groups';

declare module 'mocha' {
	export interface Context {
		doxProject: DoxProject;
		doxPackage: DoxPackage;
		sourceFile: DoxSourceFile;
		doxReference: DoxReference;
		serialisedReference: ReturnType<typeof serialiseDoxReference>;
		serialisedPackage: ReturnType<typeof serialiseDoxPackage>;
		serialisedProject: ReturnType<typeof serialiseDoxProject>;
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

		this.serialisedReference = serialiseDoxReference(this.doxReference);
		this.serialisedPackage = serialiseDoxPackage(this.doxPackage);
		this.serialisedProject = serialiseDoxProject(this.doxProject);
	});
	it('serialises a reference', function () {
		assert.exists(this.serialisedReference);
		assert.doesNotThrow(() => JSON.stringify(this.serialisedReference));
		assert.hasAllKeys(this.serialisedReference, [
			'default',
			'namespaces',
			'classes',
			'functions',
			'enums',
			'variables',
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
		]);
		assert.hasAllKeys(this.serialisedPackage.references, ['groups']);
		const ref = this.serialisedReference;
		const group = this.serialisedPackage.references.groups;

		assert.deepEqualExcludingEvery(group!, ref!, ['id' as any]);
		assert.equal(this.serialisedPackage.name, 'typedoxTestingGroups');
		assert.equal(this.serialisedPackage.version, '0.0.0');
	});
	it('serialises a dox project', function () {
		assert.exists(this.serialisedProject);
		assert.doesNotThrow(() => JSON.stringify(this.serialisedProject));
		assert.hasAllKeys(this.serialisedProject, ['packages']);
		assert.hasAllKeys(this.serialisedProject.packages, [
			'typedoxTestingGroups',
		]);
		assert.deepEqualExcludingEvery(
			this.serialisedProject.packages.typedoxTestingGroups,
			this.serialisedPackage,
			['id' as any],
		);
	});
}
