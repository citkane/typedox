import * as ts from 'typescript';
import * as path from 'path';
import * as stubs from '../stubs.spec';
import {
	tsc,
	logger as log,
	logLevels,
	TscWrapper,
} from '../../../src/backend/typedox';
import { assert } from 'chai';
import { stub } from 'sinon';

const {
	program,
	sourceFile,
	sourceType,
	starExport,
	sourceSymbol,
	confFile,
	confChild,
	checker,
} = stubs.tscWrapper;
let fooNode: ts.Node;
let fooSymbol: ts.Symbol;
let fooWrap: TscWrapper;

before(function () {
	log.setLogLevel(logLevels.info);
});
it('gets symbols from nodes', function () {
	//log.info(sourceSymbol.exports);
	sourceFile?.forEachChild((node) => {
		const { EndOfFileToken, FirstStatement, ImportDeclaration } =
			ts.SyntaxKind;
		const skip = [EndOfFileToken, FirstStatement, ImportDeclaration];
		if (skip.includes(node.kind)) {
			assert.throws(
				() => (
					tsc.getTsSymbolFromNode(checker, node),
					/Invalid node for conversion to symbol/
				),
			);
			return;
		}

		let symbol: ts.Symbol | undefined = undefined;

		assert.doesNotThrow(
			() => (symbol = tsc.getTsSymbolFromNode(checker, node)),
		);

		if (!symbol) {
			log.info(ts.isMetaProperty(node));
			log.infoKind(node.kind);
		}
		assert.exists(symbol);
	});
});

it('has created the test program correctly', function () {
	assert.isTrue(program.getGlobalDiagnostics().length === 0);
});
it('gets a ts.SourceFile', function () {
	assert.isTrue(sourceFile && ts.isSourceFile(sourceFile));
});

it('gets foo as node, symbol, type from the sourcefile', function () {
	fooSymbol = sourceType.getProperty('foo')!;
	assert.exists(fooSymbol);
	assert.exists(fooSymbol?.valueDeclaration);
	fooNode = fooSymbol.valueDeclaration!;
});

it('wraps a node', function () {
	assert.doesNotThrow(() => tsc.wrap(checker, fooNode));
	fooWrap = tsc.wrap(checker, fooNode); // should hit the cache to complete coverage
	assert.isTrue(fooWrap.isNode);
	assert.isFalse(fooWrap.isSymbol);
	assert.equal(fooWrap.nodeText, "foo = 'foo'");
	assert.equal(fooWrap.nodeDeclarationText, "export const foo = 'foo';");
	assert.equal(fooWrap.targetFileName, undefined);
	assert.equal(fooWrap.localTargetDeclaration, undefined);
	assert.equal(fooWrap.moduleSpecifier, undefined);
	assert.equal(fooWrap.alias, undefined);

	hasGeneratedCommonItems(
		fooWrap,
		'foo',
		ts.SyntaxKind.VariableDeclaration,
		0,
		ts.SymbolFlags.BlockScopedVariable,
		ts.TypeFlags.StringLiteral,
	);
	deepReportCheck(fooWrap);
});

it('errors if cache is set twice', function () {
	const stubError = stub(log, 'error').callsFake((...args) => {
		assert.equal(args[1], 'Tried to set existing cache key:');
	});
	(fooWrap as any).cacheSet('tsNode', {});
	stubError.restore();
});

it('wraps a symbol', function () {
	assert.doesNotThrow(() => (fooWrap = new TscWrapper(checker, fooSymbol))); //avoids the cached symbol from previous test
	assert.isFalse(fooWrap.isNode);
	assert.isTrue(fooWrap.isSymbol);

	hasGeneratedCommonItems(
		fooWrap,
		'foo',
		ts.SyntaxKind.VariableDeclaration,
		0,
		ts.SymbolFlags.BlockScopedVariable,
		ts.TypeFlags.StringLiteral,
	);

	assert.exists(fooWrap.report);
});
it('wraps a loner type export', function () {
	let isTypeOnly = sourceSymbol.exports?.get('isTypeOnly' as any);
	assert.exists(isTypeOnly);
	let typeWrap: TscWrapper;
	tsc.wrap(checker, isTypeOnly!);
	assert.doesNotThrow(() => (typeWrap = tsc.wrap(checker, isTypeOnly!)));
});
it('wraps a namespace export', function () {
	const child = sourceType.getProperty('child');
	assert.exists(child);
	const exportWrap = tsc.wrap(checker, child!);

	assert.equal(exportWrap.targetFileName, stubs.tscWrapper.confChild);
	assert.equal(exportWrap.localTargetDeclaration, undefined);
	assert.exists(exportWrap.moduleSpecifier);
	assert.isFalse(exportWrap.isExportStarChild);

	hasGeneratedCommonItems(
		exportWrap,
		'child',
		ts.SyntaxKind.NamespaceExport,
		ts.NodeFlags.AwaitContext,
		ts.SymbolFlags.AliasExcludes,
		ts.TypeFlags.Object,
	);

	assert.exists(exportWrap.report);
});

it('wraps a local export', function () {
	const ex = sourceType.getProperty('bar');
	const exWrap = tsc.wrap(checker, ex!);
	assert.notExists(exWrap.alias);
	assert.notExists(exWrap.targetFileName);
	assert.exists(exWrap.report);
});
it('wraps a remote export', function () {
	const exp = sourceType.getProperty('childFoo');
	const exWrap = tsc.wrap(checker, exp!);

	assert.notExists(exWrap.alias);
	assert.equal(exWrap.targetFileName, confChild);
	assert.exists(exWrap.report);
});
it('wraps a alias export', function () {
	const alias = sourceType.getProperty('alias');
	const aliasWrap = tsc.wrap(checker, alias!);
	assert.exists(aliasWrap.aliasedSymbol);
	assert.equal(aliasWrap.aliasedSymbol.name, 'bar');
	assert.exists(aliasWrap.immediatelyAliasedSymbol);
	assert.equal(aliasWrap.immediatelyAliasedSymbol!.name, 'bar');
	assert.equal(aliasWrap.hasValueDeclaration, false);
	assert.exists(aliasWrap.localTargetDeclaration);
	assert.equal(aliasWrap.localTargetDeclaration!['name'].getText(), 'bar');
	assert.equal(aliasWrap.alias, 'bar');

	hasGeneratedCommonItems(
		aliasWrap,
		'alias',
		ts.SyntaxKind.ExportSpecifier,
		ts.NodeFlags.AwaitContext,
		ts.SymbolFlags.AliasExcludes,
		ts.TypeFlags.StringLiteral,
	);
});
it('wraps a function', function () {
	const fnc = sourceType.getProperty('fnc');
	const fncWrap = tsc.wrap(checker, fnc!);
	assert.exists(fncWrap.callSignatures);
	assert.equal(fncWrap.callSignatures.length, 1);

	hasGeneratedCommonItems(
		fncWrap,
		'fnc',
		ts.SyntaxKind.VariableDeclaration,
		ts.NodeFlags.None,
		ts.SymbolFlags.BlockScopedVariable,
		ts.TypeFlags.Object,
	);

	assert.exists(fncWrap.report);
});
it('wraps a class', function () {
	let IsClass: ts.ClassDeclaration;
	sourceFile?.forEachChild(
		(node) => ts.isClassDeclaration(node) && (IsClass = node),
	);
	assert.exists(IsClass!);
	assert.doesNotThrow(() => tsc.wrap(checker, IsClass!));
});
it('parses for exportStars', function () {
	assert.equal(tsc.parseExportStars(starExport).length, 1);
	assert.equal(tsc.parseExportStars(sourceSymbol).length, 0);
});
it('wraps an exportStarChild', function () {
	assert.isTrue(tsc.isStarExport(starExport));
	const exportChild = starExport.declarations![0]['moduleSpecifier'];
	assert.exists(exportChild);

	const starChildWrap = tsc.wrap(checker, exportChild!);

	assert.isTrue(starChildWrap.isExportStarChild);
	assert.equal(starChildWrap.hasValueDeclaration, 'SourceFile');

	hasGeneratedCommonItems(
		starChildWrap,
		`"${confChild.replace('.ts', '')}"`,
		ts.SyntaxKind.StringLiteral,
		ts.NodeFlags.AwaitContext,
		ts.SymbolFlags.ValueModule,
		ts.TypeFlags.Object,
	);

	assert.exists(starChildWrap.report);
});

function hasGeneratedCommonItems(
	wrapper: TscWrapper,
	name: string,
	kind: ts.SyntaxKind,
	nodeFlag: ts.NodeFlags,
	symbolFlags: ts.SymbolFlags,
	typeFlags: ts.TypeFlags,
) {
	const { tsNode, tsSymbol, tsType } = wrapper;
	assert.isTrue(tsNode && tsNode.constructor.name === 'NodeObject');
	assert.isTrue(tsSymbol && tsSymbol.constructor.name === 'SymbolObject');
	assert.isTrue(tsType && tsType.constructor.name === 'TypeObject');
	assert.equal(wrapper.name, name);
	assert.equal(
		kind,
		wrapper.kind,
		`kinds did not match, got ${
			wrapper.kind && ts.SyntaxKind[wrapper.kind]
		}`,
	);
	assert.equal(
		nodeFlag,
		wrapper.nodeFlag,
		`nodeFlags did not match, got ${
			wrapper.nodeFlag && ts.NodeFlags[wrapper.nodeFlag]
		}`,
	);
	assert.equal(
		symbolFlags,
		wrapper.symbolFlag,
		`symbolFlags did not match, got ${ts.SymbolFlags[wrapper.symbolFlag]}`,
	);
	assert.equal(
		typeFlags,
		wrapper.typeFlag,
		`typeFlags did not match, got ${ts.TypeFlags[wrapper.typeFlag]}`,
	);

	assert.equal(ts.SyntaxKind[kind], wrapper.kindString);
	assert.equal(ts.NodeFlags[nodeFlag], wrapper.nodeFlagString);
	assert.equal(ts.SymbolFlags[symbolFlags], wrapper.symbolFlagString);
	assert.equal(ts.TypeFlags[typeFlags], wrapper.typeFlagString);
	assert.equal(wrapper.fileName, confFile);
}
function deepReportCheck(wrapper: TscWrapper) {
	assert.deepEqual(
		wrapper.report,
		{
			fileName: stubs.tscWrapper.confFile,
			nodeText: "foo = 'foo'",
			nodeDeclarationText: "export const foo = 'foo';",
			name: 'foo',
			kindString: 'VariableDeclaration',
			nodeFlagString: 'None',
			symbolFlagString: 'BlockScopedVariable',
			typeFlagString: 'StringLiteral',
			hasValueDeclaration: 'VariableDeclaration',
		},
		'Report did not match expected',
	);
}
