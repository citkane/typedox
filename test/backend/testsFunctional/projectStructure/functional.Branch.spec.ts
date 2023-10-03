import { assert } from 'chai';
import * as stubs from '../../tests.stubs.spec';
import {
	Branch,
	TsDeclaration,
	TsReference,
	config,
	logger as log,
	logLevels,
} from '../../../../src/backend/typedox';
import { stub } from 'sinon';

let specBranch: () => Branch;
let reference: TsReference;
let declarations: TsDeclaration[];
let errorStub: any;
let warningStub: any;

before(function () {
	log.setLogLevel(logLevels.error);

	reference = stubs.projectFactory.specReference();
	reference.buildRelationships();
	declarations = reference.getRootDeclarations();

	specBranch = () => new Branch(reference, declarations);
});
afterEach(function () {
	if (errorStub) errorStub.restore();
	if (warningStub) warningStub.restore();
});
it('creates a class instance', function () {
	let branch!: Branch;
	assert.doesNotThrow(() => (branch = new Branch(reference, declarations)));
	assert.exists(branch);
});
it('has set "default" on the branch', function () {
	const branch = specBranch();
	assert.exists(branch.default);
});
it('throws an error if "default" is set twice', function () {
	const branch = specBranch();
	const declaration = declarations[1];
	assert.throws(
		() => ((branch as any).Default = declaration),
		/Can have only one default on a branch/,
	);
});
it.skip('merges reExports into the declarations', function () {
	/*
	const branch = specBranch();
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
	*/
});
it('reports an error if an unknown kind is encountered', function () {
	const branch = specBranch();
	let report = '';
	errorStub = stub(log, 'error').callsFake((...args) => {
		report = args[1];
	});
	const badDeclaration = config.deepClone(declarations[0]);
	badDeclaration.group = 500;
	(branch as any).registerDeclaration(badDeclaration);
	assert.include(report, 'Did not find a group for a declaration', report);
});

it('ignores namespace names already registered', function () {
	const branch = specBranch();
	let warning = '';
	warningStub = stub(log, 'warn').callsFake((...args) => {
		warning = args[1];
	});
	const declaration = declarations.find(
		(declaration) => declaration.name === 'childSpace',
	);
	(branch as any).registerNameSpace(declaration);
	assert.include(
		warning,
		'A namespace was already registered. Ignoring this instance',
		warning,
	);
});
