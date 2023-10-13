import * as ts from 'typescript';
import * as path from 'path';
import {
	tsc,
	logger as log,
	logLevels,
	TscWrapper,
	config,
	DoxConfig,
	loggerUtils,
} from '../../../../src/backend/typedox';
import { assert } from 'chai';
import { stub } from 'sinon';
import { globalLogLevel } from '../../tests.backend.spec';
import { compilerFactory } from '../../compilerFactory';

const localLogLevel = logLevels.silent;
const localFactory = 'groups';

const { compiler, projectDir } = compilerFactory(localFactory);

let sourceFile: ts.SourceFile | undefined,
	sourceSymbol: ts.Symbol,
	sourceType: ts.Type,
	starExport: ts.Symbol,
	filePath: string,
	errorStub: ReturnType<typeof stub>,
	warningStub: ReturnType<typeof stub>,
	program: ts.Program,
	checker: ts.TypeChecker;

before(function () {
	log.setLogLevel(globalLogLevel || localLogLevel);
	const _compiler = compiler();

	({ program, checker } = _compiler);
	({ sourceFile, sourceSymbol, sourceType, starExport, filePath } =
		_compiler.getFile('index.ts'));
});
afterEach(function () {
	if (errorStub) errorStub.restore();
	if (warningStub) warningStub.restore();
});
it('has a valid program', function () {
	assert.isTrue(program.getGlobalDiagnostics().length === 0);
});
it('throws on invalid kinds', function () {
	const invalid = sourceFile?.getChildAt(0);
	assert.exists(invalid);
	assert.throws(() => {
		tsc.wrap(checker, invalid!);
	}, /Did not wrap a/);
});
it('throws on malformed kind', function () {
	assert.throws(() => {
		tsc.wrap(checker, {} as ts.Node);
	}, /Expected a Node or Symbol, got a/);
});
it('wraps a valid kind', function () {
	sourceFile?.forEachChild((node) => {
		if (!DoxConfig.isSpecifierKind(node.kind)) return;
		let wrap!: TscWrapper;
		assert.doesNotThrow(() => (wrap = tsc.wrap(checker, node)));
		wrap.cacheFlush();
	});
});
it('gets a ts.SourceFile', function () {
	assert.isTrue(sourceFile && ts.isSourceFile(sourceFile));
});
it('gets item from the sourcefile', function () {
	const symbol = sourceType.getProperty('localExport')!;
	assert.exists(symbol);
	assert.exists(symbol?.valueDeclaration);
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
	const node = sourceType.getProperty('localExport')!.valueDeclaration!;
	assert.exists(node);
	assert.doesNotThrow(() => tsc.wrap(checker, node));
	const wrap = tsc.wrap(checker, node); // should hit the cache to complete coverage
	assert.isTrue(wrap.isNode);
	assert.isFalse(wrap.isSymbol);
	assert.equal(wrap.nodeText, "localExport = 'localExport'", wrap.nodeText);
	assert.equal(
		wrap.nodeDeclarationText,
		"export const localExport = 'localExport';",
		wrap.nodeDeclarationText,
	);
	assert.equal(wrap.targetFileName, undefined, wrap.targetFileName);
	assert.equal(wrap.localDeclaration, undefined);
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
it('wraps a symbol', function () {
	const symbol = sourceType.getProperty('localExport')!;
	let wrap!: TscWrapper;
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
it('errors if cache is set twice', function () {
	const wrap = tsc.wrap(checker, sourceType.getProperty('localExport')!);
	errorStub = stub(log, 'error').callsFake((...args) => {
		assert.equal(args[1], 'Tried to set existing cache key:');
	});
	(wrap as any).cacheSet('tsNode', {});
});
it('retrieves local export declaration', function () {
	const alias = sourceType.getProperty('localAlias');
	assert.exists(alias, 'alias');
	const aliasWrap = tsc.wrap(checker, alias!);
	assert.exists(aliasWrap, 'aliasWrap');
	assert.exists(aliasWrap.localDeclaration, 'localTargetDeclaration');
	assert.equal(
		aliasWrap.localDeclaration?.kind,
		ts.SyntaxKind.VariableDeclaration,
	);
});
it('retrieves local import declaration', function () {
	const alias = sourceType.getProperty('child');
	assert.exists(alias, 'alias');
	const aliasWrap = tsc.wrap(checker, alias!);
	assert.exists(aliasWrap, 'aliasWrap');
	assert.exists(aliasWrap.localDeclaration, 'localTargetDeclaration');
	const kind = aliasWrap.localDeclaration?.kind;

	assert.equal(kind, ts.SyntaxKind.ImportSpecifier);
});
it('retrieves local exportImport declaration', function () {
	const alias = sourceType.getProperty('rabbitHole');
	assert.exists(alias, 'alias');
	const aliasWrap = tsc.wrap(checker, alias!);
	assert.exists(aliasWrap, 'aliasWrap');
	assert.exists(aliasWrap.localDeclaration, 'localTargetDeclaration');
	const kind = aliasWrap.localDeclaration?.kind;

	log.info(ts.SyntaxKind[kind!]);
	assert.equal(kind, ts.SyntaxKind.ModuleDeclaration);
});
it('gets a targetFileName from a namespaceExport', function () {
	const confChild = path.join(projectDir, 'child/child.ts');
	const specifier = sourceType.getProperty('childSpace');
	assert.exists(specifier, 'specifier');
	assert.isTrue(ts.isNamespaceExport(specifier!.declarations![0]));
	const wrap = tsc.wrap(checker, specifier!);
	assert.equal(confChild, wrap.targetFileName);
});
it('gets a targetFileName from a namespaceImport', function () {
	const confChild = path.join(projectDir, 'grandchild/grandchild.ts');
	const specifier = sourceType.getProperty('grandchildSpace');
	assert.exists(specifier, 'specifier');

	const importer = tsc.wrap(checker, specifier!).localDeclaration;
	assert.isTrue(ts.isNamespaceImport(importer!));
	const wrap = tsc.wrap(checker, specifier!);
	assert.equal(confChild, wrap.targetFileName);
});
it('gets a targetFileName from a importSpecifier', function () {
	const confChild = path.join(projectDir, 'child/child.ts');
	const specifier = sourceType.getProperty('child');
	assert.exists(specifier, 'specifier');
	const importer = tsc.wrap(checker, specifier!).localDeclaration;
	assert.exists(importer, 'importer');
	assert.isTrue(ts.isImportSpecifier(importer!));
	const wrap = tsc.wrap(checker, importer!);
	assert.equal(confChild, wrap.targetFileName);
});
it('gets a targetFileName from a exportSpecifier', function () {
	const confChild = path.join(projectDir, 'child/kinds.ts');
	const specifier = sourceType.getProperty('func');
	assert.exists(specifier, 'specifier');
	assert.isTrue(ts.isExportSpecifier(specifier!.declarations![0]));
	const wrap = tsc.wrap(checker, specifier!);
	assert.equal(confChild, wrap.targetFileName);
});
it('gets a targetFileName from a ExportDeclaration', function () {
	const confChild = path.join(projectDir, 'child/child.ts');
	const specifier = sourceSymbol.exports?.get('__export' as any);
	assert.exists(specifier, 'specifier');
	const declaration = specifier!.declarations![0];
	assert.exists(declaration);
	assert.isTrue(ts.isExportDeclaration(declaration));
	const wrap = tsc.wrap(checker, declaration!);
	assert.equal(confChild, wrap.targetFileName);
});
it('gets a targetFileName from a importClause', function () {
	const confChild = path.join(projectDir, 'child/child.ts');
	const specifier = sourceType.getProperty('defaultExport');
	assert.exists(specifier, 'specifier');
	const importer = tsc.wrap(checker, specifier!).localDeclaration;
	assert.exists(importer, 'importer');
	assert.isTrue(ts.isImportClause(importer!));
	const wrap = tsc.wrap(checker, importer!);
	assert.equal(confChild, wrap.targetFileName);
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
	assert.exists(remoteExport, 'remoteExport');
	const remoteExportWrap = tsc.wrap(checker, remoteExport!);

	assert.notExists(remoteExportWrap.alias);
	assert.exists(remoteExportWrap.report);
});
it('wraps a alias export', function () {
	const alias = sourceType.getProperty('localAlias');
	assert.exists(alias, 'alias');
	const aliasWrap = tsc.wrap(checker, alias!);
	assert.exists(aliasWrap, 'aliasWrap');
	assert.exists(aliasWrap.aliasedSymbol, 'aliasedSymbol');
	assert.equal(aliasWrap.aliasedSymbol!.name, 'localDeclaration');
	assert.exists(
		aliasWrap.immediatelyAliasedSymbol,
		'immediatelyAliasedSymbol',
	);
	assert.equal(aliasWrap.immediatelyAliasedSymbol!.name, 'localDeclaration');
	assert.equal(aliasWrap.hasValueDeclaration, false);
	assert.exists(aliasWrap.localDeclaration, 'localTargetDeclaration');
	assert.equal(
		(aliasWrap.localDeclaration as any)!['name'].getText(),
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
	const confChild = path.join(projectDir, 'child/child.ts');
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
