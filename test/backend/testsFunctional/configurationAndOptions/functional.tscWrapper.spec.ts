import * as ts from 'typescript';
import * as path from 'path';
import * as stubs from '../../tests.stubs.spec';
import {
	tsc,
	logger as log,
	logLevels,
	TscWrapper,
	config,
} from '../../../../src/backend/typedox';
import { assert } from 'chai';
import { stub } from 'sinon';

const { compiler, projectDir, tsConfigPath } = stubs.compilerFactory('groups');
const { program, checker, getFile } = compiler();
const { sourceFile, sourceSymbol, sourceType, starExport, filePath } =
	getFile('index.ts');
const confChild = path.join(projectDir, 'child/child.ts');

let node: ts.Node;
let symbol: ts.Symbol;
let wrap: TscWrapper;
let errorStub: any;

before(function () {
	log.setLogLevel(logLevels.error);
});
afterEach(function () {
	if (errorStub) errorStub.restore();
});
it('gets symbols from nodes', function () {
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

it('gets item from the sourcefile', function () {
	symbol = sourceType.getProperty('localExport')!;
	assert.exists(symbol);
	assert.exists(symbol?.valueDeclaration);
	node = symbol.valueDeclaration!;
});

it('gets node and type from a symbol', function () {
	let nodeAndType!: { node: ts.Node; type: ts.Type };
	const symbol = sourceType.getProperty('localFunc')!;
	assert.exists(symbol);
	assert.doesNotThrow(
		() => (nodeAndType = tsc.getNodeAndTypeFromSymbol(checker, symbol)),
	);
	assert.exists(nodeAndType.node);
	assert.exists(nodeAndType.type);

	const noDeclarations = config.deepClone(symbol);
	delete noDeclarations.declarations;
	assert.doesNotThrow(
		() =>
			(nodeAndType = tsc.getNodeAndTypeFromSymbol(
				checker,
				noDeclarations,
			)),
	);
	assert.exists(nodeAndType.node);
	assert.exists(nodeAndType.type);
});

it('wraps a node', function () {
	assert.doesNotThrow(() => tsc.wrap(checker, node));
	wrap = tsc.wrap(checker, node); // should hit the cache to complete coverage
	assert.isTrue(wrap.isNode);
	assert.isFalse(wrap.isSymbol);
	assert.equal(wrap.nodeText, "localExport = 'localExport'", wrap.nodeText);
	assert.equal(
		wrap.nodeDeclarationText,
		"export const localExport = 'localExport';",
		wrap.nodeDeclarationText,
	);
	assert.equal(wrap.targetFileName, undefined, wrap.targetFileName);
	assert.equal(wrap.localTargetDeclaration, undefined);
	assert.equal(wrap.moduleSpecifier, undefined);
	assert.equal(wrap.alias, undefined);

	hasGeneratedCommonItems(
		wrap,
		'localExport',
		ts.SyntaxKind.VariableDeclaration,
		0,
		ts.SymbolFlags.BlockScopedVariable,
		ts.TypeFlags.StringLiteral,
	);
	deepReportCheck(wrap);
});

it('errors if cache is set twice', function () {
	errorStub = stub(log, 'error').callsFake((...args) => {
		assert.equal(args[1], 'Tried to set existing cache key:');
	});
	(wrap as any).cacheSet('tsNode', {});
});

it('wraps a symbol', function () {
	assert.doesNotThrow(() => (wrap = new TscWrapper(checker, symbol))); //avoids the cached symbol from previous test
	assert.isFalse(wrap.isNode);
	assert.isTrue(wrap.isSymbol);

	hasGeneratedCommonItems(
		wrap,
		'localExport',
		ts.SyntaxKind.VariableDeclaration,
		0,
		ts.SymbolFlags.BlockScopedVariable,
		ts.TypeFlags.StringLiteral,
	);

	assert.exists(wrap.report);
});
it('wraps a loner type export', function () {
	let isTypeOnly = sourceSymbol.exports?.get('isTypeOnly' as any);
	assert.exists(isTypeOnly);
	let typeWrap: TscWrapper;
	tsc.wrap(checker, isTypeOnly!);
	assert.doesNotThrow(() => (typeWrap = tsc.wrap(checker, isTypeOnly!)));
});
it('wraps a namespace export', function () {
	const child = sourceType.getProperty('childSpace');
	assert.exists(child);
	const exportWrap = tsc.wrap(checker, child!);
	assert.exists(exportWrap.report);
	assert.equal(exportWrap.kind, ts.SyntaxKind.NamespaceExport);

	hasGeneratedCommonItems(
		exportWrap,
		'childSpace',
		ts.SyntaxKind.NamespaceExport,
		ts.NodeFlags.AwaitContext,
		ts.SymbolFlags.AliasExcludes,
		ts.TypeFlags.Object,
	);

	assert.exists(exportWrap.report);
});

it('wraps a local export', function () {
	const ex = sourceType.getProperty('localExport');
	const exWrap = tsc.wrap(checker, ex!);
	assert.notExists(exWrap.alias);
	assert.notExists(exWrap.targetFileName);
	assert.exists(exWrap.report);
});
it('wraps a remote export', function () {
	const remoteExport = sourceType.getProperty('child');
	assert.exists(remoteExport);
	const remoteExportWrap = tsc.wrap(checker, remoteExport!);

	assert.notExists(remoteExportWrap.alias);
	assert.equal(remoteExportWrap.targetFileName, confChild);
	assert.exists(remoteExportWrap.report);
});
it('wraps a alias export', function () {
	const alias = sourceType.getProperty('localAlias');
	const aliasWrap = tsc.wrap(checker, alias!);
	assert.exists(aliasWrap.aliasedSymbol);
	assert.equal(aliasWrap.aliasedSymbol!.name, 'localDeclaration');
	assert.exists(aliasWrap.immediatelyAliasedSymbol);
	assert.equal(aliasWrap.immediatelyAliasedSymbol!.name, 'localDeclaration');
	assert.equal(aliasWrap.hasValueDeclaration, false);
	assert.exists(aliasWrap.localTargetDeclaration);
	assert.equal(
		(aliasWrap.localTargetDeclaration as any)!['name'].getText(),
		'localDeclaration',
	);
	assert.equal(aliasWrap.alias, 'localDeclaration');

	hasGeneratedCommonItems(
		aliasWrap,
		'localAlias',
		ts.SyntaxKind.ExportSpecifier,
		ts.NodeFlags.AwaitContext,
		ts.SymbolFlags.AliasExcludes,
		ts.TypeFlags.StringLiteral,
	);
});
it('wraps a function', function () {
	const fnc = sourceType.getProperty('localFunc');
	const fncWrap = tsc.wrap(checker, fnc!);
	assert.exists(fncWrap.callSignatures);
	assert.equal(fncWrap.callSignatures.length, 1);

	hasGeneratedCommonItems(
		fncWrap,
		'localFunc',
		ts.SyntaxKind.FunctionDeclaration,
		ts.NodeFlags.HasImplicitReturn,
		ts.SymbolFlags.Function,
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

it('wraps a reExportChild', function () {
	assert.isTrue(tsc.isReExport(starExport));
	const exportChild = (starExport.declarations![0] as any)['moduleSpecifier'];
	assert.exists(exportChild);

	const starChildWrap = tsc.wrap(checker, exportChild!);

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
	assert.equal(wrapper.fileName, sourceFile!.fileName);
}
function deepReportCheck(wrapper: TscWrapper) {
	assert.deepEqual(
		wrapper.report,
		{
			fileName: filePath,
			nodeText: "localExport = 'localExport'",
			nodeDeclarationText: "export const localExport = 'localExport';",
			name: 'localExport',
			kindString: 'VariableDeclaration',
			nodeFlagString: 'None',
			symbolFlagString: 'BlockScopedVariable',
			typeFlagString: 'StringLiteral',
			hasValueDeclaration: 'VariableDeclaration',
		},
		'Report did not match expected',
	);
}
