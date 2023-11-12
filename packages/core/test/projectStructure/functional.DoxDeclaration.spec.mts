import { assert } from 'chai';
import ts, { __String } from 'typescript';
import {
	CategoryKind,
	Dox,
	DoxDeclaration,
	DoxSourceFile,
	declarationUtils,
} from '@typedox/core';
import { stub } from 'sinon';
import { log, logLevels } from '@typedox/logger';
import { declarationFactory, doxStub, projectFactory } from '@typedox/test';

const localLogLevel = logLevels.silent;
const localFactory = 'categories';
const escape = ts.escapeLeadingUnderscores;

declare module 'mocha' {
	export interface Context {
		errorReports: object[];
		errorStub?: ReturnType<typeof stub>;
	}
}

export default function () {
	before(function () {
		log.setLogLevel(doxStub.globalLogLevel || localLogLevel);
		this.errorReports = [];
	});
	beforeEach(function () {
		this.errorStub = stub(log, 'error').callsFake((...args) => {
			this.errorReports.push(args);
			return false;
		});
		this.errorReports = [];
	});
	afterEach(function () {
		if (this.errorStub) this.errorStub.restore();
	});

	it('creates a class instance', function () {
		const doxFile = doxStub.doxSourceFile(localFactory);
		const symbol = doxStub.getExportedSymbol.call(
			doxFile.fileSymbol,
			escape('localExport'),
		);
		let declaration!: DoxDeclaration;

		assert.exists(symbol, 'symbol');
		assert.exists(doxFile.doxProject, 'doxProject');
		assert.exists(doxFile.doxProject.options, 'options');
		new DoxDeclaration(doxFile, symbol!);
		assert.doesNotThrow(
			() => (declaration = new DoxDeclaration(doxFile, symbol!)),
		);
		assert.isTrue(Dox.isDoxDeclaration(declaration));
		assert.lengthOf(
			this.errorReports,
			0,
			JSON.stringify(this.errorReports, null, 4),
		);
	});
	it('does not error a nameSpaceExport', function () {
		let symbol = getSymbol(escape('childSpace'));
		assert.exists(symbol);
		new DoxDeclaration(makeDoxSourceFile(), symbol!);

		symbol = getSymbol(escape('grandchildSpace'));
		assert.exists(symbol);
		new DoxDeclaration(makeDoxSourceFile(), symbol!);

		assert.lengthOf(
			this.errorReports,
			0,
			JSON.stringify(this.errorReports, null, 4),
		);
	});
	it('does not error a module declaration', function () {
		let symbol = getSymbol(escape('moduleDeclaration'));
		assert.exists(symbol, 'moduleDeclaration');
		const declaration = new DoxDeclaration(makeDoxSourceFile(), symbol!);
		const wrapped = declaration.tsWrap(symbol!);
		assert.exists(wrapped, 'wrapped');
		declaration.relate(wrapped);

		assert.isTrue(declaration.localDeclarationMap.has(escape('nsExport')));
		const child = declaration.localDeclarationMap.get(escape('nsExport'));
		const sourceFile = child!.doxSourceFile;
		assert.exists(sourceFile, 'sourceFile');
		assert.equal(
			sourceFile.constructor.name,
			'DoxSourceFile',
			sourceFile.constructor.name,
		);

		symbol = getSymbol(escape('emptyDeclaration'));
		assert.exists(symbol, 'emptyDeclaration');
		new DoxDeclaration(makeDoxSourceFile(), symbol!);

		assert.lengthOf(
			this.errorReports,
			0,
			JSON.stringify(this.errorReports, null, 4),
		);
	});
	it('does not error an export specifier', function () {
		let symbol = getSymbol(escape('localDeclaration'));
		assert.exists(symbol);
		new DoxDeclaration(makeDoxSourceFile(), symbol!);

		symbol = getSymbol(escape('localAlias'));
		assert.exists(symbol);
		new DoxDeclaration(makeDoxSourceFile(), symbol!);

		assert.lengthOf(
			this.errorReports,
			0,
			JSON.stringify(this.errorReports, null, 4),
		);
	});
	it('does not error an import specifier', function () {
		const symbol = getSymbol(escape('child'));
		assert.exists(symbol);
		new DoxDeclaration(makeDoxSourceFile(), symbol!);

		assert.lengthOf(
			this.errorReports,
			0,
			JSON.stringify(this.errorReports, null, 4),
		);
	});
	it('does not error a reExport', function () {
		const symbol = getSymbol('__export' as __String);
		assert.exists(symbol);
		new DoxDeclaration(makeDoxSourceFile(), symbol!);

		assert.lengthOf(
			this.errorReports,
			0,
			//JSON.stringify(this.errorReports, null, 4),
		);
	});
	it(`does not error any of the export symbols in the "${localFactory}" factory:`, function () {
		makeDoxSourceFile().fileSymbol.exports!.forEach((symbol) => {
			const declaration = new DoxDeclaration(makeDoxSourceFile(), symbol);
			assert.lengthOf(
				this.errorReports,
				0,
				JSON.stringify(this.errorReports, null, 4),
			);
		});
	});
	it(`assigns categories to each export symbol in the "${localFactory}" factory:`, function () {
		makeDoxSourceFile().fileSymbol.exports!.forEach((symbol) => {
			const declaration = new DoxDeclaration(makeDoxSourceFile(), symbol);
			assert.exists(declaration.category);
			assert.isTrue(
				Object.values(CategoryKind).includes(
					declaration.category as any,
				),
				`did not find ${declaration.category}`,
			);
		});
	});
	it('creates an error if an unknown category is encountered', function () {
		const symbol = getSymbol(escape('localDeclaration'));
		assert.exists(symbol);
		const declaration = new DoxDeclaration(makeDoxSourceFile(), symbol!);
		const { valueNode, wrappedItem, checker } = declaration;
		declarationUtils.getCategoryKind(
			valueNode,
			wrappedItem,
			ts.SyntaxKind.AmpersandAmpersandEqualsToken,
			checker,
		);
		assert.lengthOf(this.errorReports, 1);
		assert.include(
			this.errorReports[0].toString(),
			'AmpersandAmpersandEqualsToken',
		);
	});

	it('flags non exported declarations', function () {
		const notExported = declarationFactory('common', escape('localVar'));
		const exported = declarationFactory('specifiers', escape('localVar'));

		assert.exists(notExported.flags, 'notExported');
		assert.exists(exported.flags, 'exported');

		assert.exists(notExported.flags.notExported);
		assert.notExists(exported.flags.notExported);
	});
	it('resolves scope keywords', function () {
		const varScope = declarationFactory('scopes', escape('varScope'));
		const letScope = declarationFactory('scopes', escape('letScope'));
		const constScope = declarationFactory('scopes', escape('constScope'));
		const expected = ['var', 'let', 'const'];
		[varScope, letScope, constScope].forEach((declaration, i) => {
			const { flags } = declaration;
			assert.exists(flags.scopeKeyword);
			assert.equal(flags.scopeKeyword, expected[i]);
		});
	});

	let _doxSourceFile: DoxSourceFile;
	function makeDoxSourceFile() {
		return (_doxSourceFile ??= projectFactory.specDoxSourceFile(
			localFactory,
			undefined,
			'index.ts',
		));
	}
	function getSymbol(key: __String) {
		return doxStub.getExportedSymbol.call(
			makeDoxSourceFile().fileSymbol,
			key,
		);
	}
}
