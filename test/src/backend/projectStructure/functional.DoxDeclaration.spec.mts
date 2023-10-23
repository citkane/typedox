import { assert } from 'chai';
import * as stubs from '../../factories/tests.stubs.mjs';
import ts from 'typescript';

import {
	DeclarationGroup,
	DoxDeclaration,
	DoxSourceFile,
	log,
	logLevels,
} from 'typedox';
import { stub } from 'sinon';
import { globalLogLevel } from '../../tests.backend.spec.mjs';
import { projectFactory } from '../../factories/projectFactory.mjs';
import { declarationFactory } from '../../factories/declarationFactory.mjs';

const localLogLevel = logLevels.silent;
const localFactory = 'groups';

declare module 'mocha' {
	export interface Context {
		errorReports: object[];
		errorStub?: ReturnType<typeof stub>;
	}
}

export default function () {
	before(function () {
		log.setLogLevel(globalLogLevel || localLogLevel);
		this.errorReports = [];
	});
	beforeEach(function () {
		this.errorStub = stub(log, 'error').callsFake((...args) => {
			this.errorReports.push(args);
		});
		this.errorReports = [];
	});
	afterEach(function () {
		if (this.errorStub) this.errorStub.restore();
	});

	it('creates a class instance', function () {
		const doxSourceFile = stubs.doxSourceFile(localFactory);
		const symbol = stubs.getExportedSymbol.call(
			doxSourceFile.fileSymbol,
			'localExport',
		);
		let declaration!: DoxDeclaration;

		assert.exists(symbol);
		assert.doesNotThrow(
			() => (declaration = new DoxDeclaration(doxSourceFile, symbol!)),
		);
		assert.isTrue(declaration.isDoxDeclaration);
		assert.lengthOf(
			this.errorReports,
			0,
			JSON.stringify(this.errorReports, null, 4),
		);
	});
	it('does not error a nameSpaceExport', function () {
		let symbol = getSymbol('childSpace');
		assert.exists(symbol);
		new DoxDeclaration(doxSourceFile(), symbol!);

		symbol = getSymbol('grandchildSpace');
		assert.exists(symbol);
		new DoxDeclaration(doxSourceFile(), symbol!);

		assert.lengthOf(
			this.errorReports,
			0,
			JSON.stringify(this.errorReports, null, 4),
		);
	});
	it('does not error a module declaration', function () {
		let symbol = getSymbol('moduleDeclaration');
		assert.exists(symbol, 'moduleDeclaration');
		const declaration = new DoxDeclaration(doxSourceFile(), symbol!);
		assert.isTrue(declaration.localDeclarationMap.has('nsExport'));
		const child = declaration.localDeclarationMap.get('nsExport');
		const sourceFile = child!.doxSourceFile;
		assert.exists(sourceFile, 'sourceFile');
		assert.equal(
			sourceFile.constructor.name,
			'DoxSourceFile',
			sourceFile.constructor.name,
		);

		symbol = getSymbol('emptyDeclaration');
		assert.exists(symbol, 'emptyDeclaration');
		new DoxDeclaration(doxSourceFile(), symbol!);

		assert.lengthOf(
			this.errorReports,
			0,
			JSON.stringify(this.errorReports, null, 4),
		);
	});
	it('does not error an export specifier', function () {
		let symbol = getSymbol('localDeclaration');
		assert.exists(symbol);
		new DoxDeclaration(doxSourceFile(), symbol!);

		symbol = getSymbol('localAlias');
		assert.exists(symbol);
		new DoxDeclaration(doxSourceFile(), symbol!);

		assert.lengthOf(
			this.errorReports,
			0,
			JSON.stringify(this.errorReports, null, 4),
		);
	});
	it('does not error an import specifier', function () {
		const symbol = getSymbol('child');
		assert.exists(symbol);
		new DoxDeclaration(doxSourceFile(), symbol!);

		assert.lengthOf(
			this.errorReports,
			0,
			JSON.stringify(this.errorReports, null, 4),
		);
	});
	it('does not error a reExport', function () {
		const symbol = getSymbol('__export');
		assert.exists(symbol);
		new DoxDeclaration(doxSourceFile(), symbol!);

		assert.lengthOf(
			this.errorReports,
			0,
			//JSON.stringify(this.errorReports, null, 4),
		);
	});
	it(`does not error any of the export symbols in the "${localFactory}" factory:`, function () {
		doxSourceFile().fileSymbol.exports!.forEach((symbol) => {
			const declaration = new DoxDeclaration(doxSourceFile(), symbol);
			assert.lengthOf(
				this.errorReports,
				0,
				JSON.stringify(this.errorReports, null, 4),
			);
		});
	});
	it(`assigns groups to each export symbol in the "${localFactory}" factory:`, function () {
		doxSourceFile().fileSymbol.exports!.forEach((symbol) => {
			const declaration = new DoxDeclaration(doxSourceFile(), symbol);
			assert.exists(declaration.group);
			assert.isTrue(
				Object.values(DeclarationGroup).includes(
					declaration.group as any,
				),
				`did not find ${declaration.group}`,
			);
		});
	});
	it('creates an error if an unknown group is encountered', function () {
		const symbol = getSymbol('localDeclaration');
		assert.exists(symbol);
		const declaration = new DoxDeclaration(doxSourceFile(), symbol!);
		(declaration as any).groupTsKind =
			ts.SyntaxKind.AmpersandAmpersandEqualsToken;

		declaration.group;

		assert.lengthOf(this.errorReports, 1);
		assert.include(
			this.errorReports[0].toString(),
			'AmpersandAmpersandEqualsToken',
		);
	});

	it('flags non exported declarations', function () {
		const notExported = declarationFactory('common', 'localVar');
		const exported = declarationFactory('specifiers', 'localVar');

		assert.exists(notExported.flags, 'notExported');
		assert.exists(exported.flags, 'exported');

		assert.exists(notExported.flags.notExported);
		assert.notExists(exported.flags.notExported);
	});
	it('resolves scope keywords', function () {
		const varScope = declarationFactory('scopes', 'varScope');
		const letScope = declarationFactory('scopes', 'letScope');
		const constScope = declarationFactory('scopes', 'constScope');
		const expected = ['var', 'let', 'const'];
		[varScope, letScope, constScope].forEach((declaration, i) => {
			const { flags } = declaration;
			assert.exists(flags.scopeKeyword);
			assert.equal(flags.scopeKeyword, expected[i]);
		});
	});

	let _doxSourceFile: DoxSourceFile;
	function doxSourceFile() {
		return (_doxSourceFile ??= projectFactory.specDoxSourceFile(
			localFactory,
			undefined,
			'index.ts',
		));
	}
	function getSymbol(key: string) {
		return stubs.getExportedSymbol.call(doxSourceFile().fileSymbol, key);
	}
}
