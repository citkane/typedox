import { assert } from 'chai';
import * as stubs from '../../tests.stubs.spec';
import * as ts from 'typescript';
import * as path from 'path';
import {
	Branch,
	Relation,
	TsDeclaration,
	TsReference,
	TsSourceFile,
	config,
	logger as log,
	logLevels,
} from '../../../../src/backend/typedox';
import { stub } from 'sinon';
import { deepClone } from '../../../../src/backend/config/_namespace';

let reference: TsReference;
let branch: Branch;
let declarations: TsDeclaration[];
let errorStub: any;

before(function () {
	log.setLogLevel(logLevels.error);

	reference = stubs.projectFactory.specReference();
	reference.buildRelationships();
	declarations = reference.getRootDeclarations();
});
afterEach(function () {
	if (errorStub) errorStub.restore();
});
it('creates a class instance', function () {
	assert.doesNotThrow(() => (branch = new Branch(reference, declarations)));
	assert.exists(branch);
});
it('has set "default" on the branch', function () {
	assert.exists(branch.default);
});
it('throws an error if "default" is set twice', function () {
	const declaration = declarations[1];
	assert.throws(
		() => ((branch as any).Default = declaration),
		/Can have only one default on a branch/,
	);
});
it('merges reExports into the declarations', function () {
	let declaration = declarations[1];
	assert.isTrue((branch as any)._declarationBundle.has(declaration.name));
	assert.doesNotThrow(() =>
		(branch as any).mergeReExportIntoDeclarations(declaration),
	);
	declaration = config.deepClone(declaration) as TsDeclaration;
	declaration.name = 'unique';
	assert.doesNotThrow(() =>
		(branch as any).mergeReExportIntoDeclarations(declaration),
	);
	assert.isTrue((branch as any)._declarationBundle.has('unique'));
	(branch as any)._declarationBundle.delete('unique');
});
it('reports an error if an unknown kind is encountered', function () {
	let report = '';
	errorStub = stub(log, 'error').callsFake((...args) => {
		report = args[1];
	});
	const badDeclaration = config.deepClone(declarations[0]);
	badDeclaration.group = 500;
	(branch as any).registerDeclaration(badDeclaration);
	assert.include(report, 'Did not find a group for a declaration', report);
});
