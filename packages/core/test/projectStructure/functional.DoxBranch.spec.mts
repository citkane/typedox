import { assert } from 'chai';
import { Branch, DoxDeclaration, DoxReference, config } from '@typedox/core';
import { stub } from 'sinon';

import { log, logLevels } from '@typedox/logger';
import { doxStub, projectFactory } from '@typedox/test';
import ts from 'typescript';

const localLogLevel = logLevels.silent;
const localFactory = 'specifiers';
const escape = ts.escapeLeadingUnderscores;

let _doxReference: DoxReference;
const reference = () =>
	(_doxReference ??= projectFactory.specDoxReference(localFactory));
let _declarations: DoxDeclaration[];
const declarations = () => {
	return (_declarations ??= (reference() as any).getRootDeclarations());
};
declare module 'mocha' {
	export interface Context {
		errorStub?: ReturnType<typeof stub>;
		warningStub?: ReturnType<typeof stub>;
	}
}

export default function () {
	before(function () {
		log.setLogLevel(doxStub.globalLogLevel || localLogLevel);
	});
	afterEach(function () {
		if (this.errorStub) this.errorStub.restore();
		if (this.warningStub) this.warningStub.restore();
	});

	it('creates a class instance', function () {
		let branch!: Branch;
		const reference = doxStub.doxReference(localFactory);
		const declarations = [
			doxStub.doxDeclaration(localFactory, escape('localVar')),
		];
		new Branch(reference, declarations);
		assert.doesNotThrow(
			() => (branch = new Branch(reference, declarations)),
		);
		assert.exists(branch);
	});

	it('merges reExports into the declarations', function () {
		const branch = new Branch(reference(), declarations());
		assert.exists(branch);
		let declaration = declarations()[1];
		assert.exists(declaration);
		assert.isTrue(
			(branch as any).branchDeclarations.has(declaration),
			declaration.name,
		);
		assert.doesNotThrow(() =>
			(branch as any).mergeReExportIntoDeclarations(declaration),
		);
		declaration = doxStub.deepClone(declaration) as DoxDeclaration;
		(declaration as any).name = 'unique';
		assert.doesNotThrow(() =>
			(branch as any).mergeReExportIntoDeclarations(declaration),
		);
		assert.isTrue((branch as any).branchDeclarations.has(declaration));
	});
	it('reports an error if an unknown kind is encountered', function () {
		let report = '';
		this.errorStub = stub(log, 'error').callsFake((...args) => {
			report = args[1];
			return false;
		});

		const branch = new Branch(reference(), declarations());

		const badDeclaration = doxStub.deepClone(declarations()[0]);
		badDeclaration.category = 500;
		(branch as any).registerDeclaration(badDeclaration);
		assert.include(
			report,
			'Did not find a category for a declaration',
			report,
		);
	});

	it('ignores namespace names already registered', function () {
		let warning = '';
		this.warningStub = stub(log, 'warn').callsFake((...args) => {
			warning = args[2];
		});

		const branch = new Branch(reference(), declarations());

		const declaration = declarations().find(
			(declaration) => declaration.name === 'childSpace',
		);
		(branch as any).registerNameSpace(declaration);
		assert.include(warning, 'A namespace was already registered', warning);
	});
}
