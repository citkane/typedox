import ts from 'typescript';
import * as path from 'path';
import { tsc, TsWrapper, config, Dox } from 'typedox';
import { assert } from 'chai';
import { stub } from 'sinon';
import { log, logLevels } from 'typedox/logger';
import { compilerFactory, doxStub } from 'typedox-test';

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

export default function () {
	before(function () {
		log.setLogLevel(doxStub.globalLogLevel || localLogLevel);
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
	it('errors on malformed kind', function () {
		let error = '';
		errorStub = stub(log, 'error').callsFake((message) => {
			error = message.toString();
			return false;
		});
		tsc.wrap(checker, program, {} as ts.Node);
		assert.include(error, 'Expected a Node or Symbol');
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
		let nodesAndType!: ReturnType<typeof tsc.getNodesAndTypeFromSymbol>;
		const symbol = sourceType.getProperty('localFunc')!;
		assert.exists(symbol);
		assert.doesNotThrow(
			() =>
				(nodesAndType = tsc.getNodesAndTypeFromSymbol(checker, symbol)),
		);
		assert.exists(nodesAndType.nodes);
		assert.exists(nodesAndType.type);

		const noDeclarations = config.deepClone(symbol);
		delete noDeclarations.declarations;
		assert.doesNotThrow(
			() =>
				(nodesAndType = tsc.getNodesAndTypeFromSymbol(
					checker,
					noDeclarations,
				)),
		);
		assert.exists(nodesAndType.nodes);
		assert.exists(nodesAndType.type);
	});
	it('wraps a node', function () {
		const node = sourceType.getProperty('localExport')!.valueDeclaration!;
		assert.exists(node);
		assert.doesNotThrow(() => tsc.wrap(checker, program, node));
		const wrap = tsc.wrap(checker, program, node); // should hit the cache to complete coverage
		assert.exists(wrap);
		assert.equal(
			wrap!.nodeText,
			"localExport = 'localExport'",
			wrap!.nodeText,
		);
		assert.equal(
			wrap!.nodeDeclarationText,
			"export const localExport = 'localExport';",
			wrap!.nodeDeclarationText,
		);
		assert.equal(wrap!.targetFileName, undefined, wrap!.targetFileName);
		assert.equal(wrap!.localDeclaration, undefined);
		assert.equal(wrap!.moduleSpecifier, undefined);
		assert.equal(wrap!.alias, undefined);

		hasGeneratedCommonItems(
			wrap!,
			'localExport',
			ts.SyntaxKind.VariableDeclaration,
			0,
			ts.SymbolFlags.BlockScopedVariable,
			ts.TypeFlags.StringLiteral,
		);
		deepReportCheck(wrap!);
	});
	it('wraps a symbol', function () {
		const symbol = sourceType.getProperty('localExport')!;
		let wrap!: TsWrapper;
		assert.doesNotThrow(
			() => (wrap = new TsWrapper(checker, program, symbol)),
		); //avoids the cached symbol from previous test

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
		const wrap = tsc.wrap(
			checker,
			program,
			sourceType.getProperty('localExport')!,
		);
		errorStub = stub(log, 'error').callsFake((...args) => {
			assert.equal(args[1], 'Tried to set existing cache key:');
			return false;
		});
		(wrap as any).cacheSet('tsNode', {});
	});
	it('retrieves local export declaration', function () {
		const alias = sourceType.getProperty('localAlias');
		assert.exists(alias, 'alias');
		const aliasWrap = tsc.wrap(checker, program, alias!);
		assert.exists(aliasWrap, 'aliasWrap');
		assert.exists(aliasWrap!.localDeclaration, 'localTargetDeclaration');
		assert.equal(
			aliasWrap!.localDeclaration?.valueDeclaration?.kind,
			ts.SyntaxKind.VariableDeclaration,
		);
	});
	it('retrieves local import declaration', function () {
		const alias = sourceType.getProperty('child');
		assert.exists(alias, 'alias');
		const aliasWrap = tsc.wrap(checker, program, alias!);
		assert.exists(aliasWrap, 'aliasWrap');
		assert.exists(aliasWrap!.localDeclaration, 'localTargetDeclaration');
		const kind = aliasWrap!.localDeclaration?.declarations![0].kind;

		assert.equal(kind, ts.SyntaxKind.ImportSpecifier);
	});
	it('retrieves local exportImport declaration', function () {
		const alias = sourceType.getProperty('rabbitHole');
		assert.exists(alias, 'alias');
		const aliasWrap = tsc.wrap(checker, program, alias!);
		assert.exists(aliasWrap, 'aliasWrap');
		assert.exists(aliasWrap!.localDeclaration, 'localTargetDeclaration');
		const kind = aliasWrap!.localDeclaration?.valueDeclaration?.kind;
		assert.equal(kind, ts.SyntaxKind.ModuleDeclaration);
	});
	it('gets a targetFileName from a namespaceExport', function () {
		const confChild = path.join(projectDir, 'child/child.ts');
		const specifier = sourceType.getProperty('childSpace');
		assert.exists(specifier, 'specifier');
		assert.isTrue(ts.isNamespaceExport(specifier!.declarations![0]));
		const wrap = tsc.wrap(checker, program, specifier!);
		assert.exists(wrap);
		assert.equal(confChild, wrap!.targetFileName);
	});
	it('gets a targetFileName from a namespaceImport', function () {
		const confChild = path.join(projectDir, 'grandchild/grandchild.ts');
		const specifier = sourceType.getProperty('grandchildSpace');
		assert.exists(specifier, 'specifier');

		const importerWrap = tsc.wrap(checker, program, specifier!);
		assert.exists(importerWrap);
		const importer = importerWrap!.localDeclaration?.declarations![0];
		assert.exists(importer);
		assert.isTrue(ts.isNamespaceImport(importer!));
		const wrap = tsc.wrap(checker, program, importer!);
		assert.exists(wrap);
		assert.equal(confChild, wrap!.targetFileName);
	});
	it('gets a targetFileName from a importSpecifier', function () {
		const confChild = path.join(projectDir, 'child/child.ts');
		const specifier = sourceType.getProperty('child');
		assert.exists(specifier, 'specifier');
		const importerWrap = tsc.wrap(checker, program, specifier!);
		assert.exists(importerWrap);
		const importer = importerWrap!.localDeclaration?.declarations![0];
		assert.exists(importer, 'importer');
		assert.isTrue(ts.isImportSpecifier(importer!));
		const wrap = tsc.wrap(checker, program, importer!);
		assert.exists(wrap);
		assert.equal(confChild, wrap!.targetFileName);
	});
	it('gets a targetFileName from a exportSpecifier', function () {
		const confChild = path.join(projectDir, 'child/kinds.ts');
		const specifier = sourceType.getProperty('func');
		assert.exists(specifier, 'specifier');
		const exporter = specifier!.declarations![0];
		assert.exists(exporter);
		assert.isTrue(ts.isExportSpecifier(exporter));
		const wrap = tsc.wrap(checker, program, exporter);
		assert.exists(wrap);
		assert.equal(confChild, wrap!.targetFileName);
	});
	it('gets a targetFileName from a ExportDeclaration', function () {
		const confChild = path.join(projectDir, 'child/child.ts');
		const specifier = sourceSymbol.exports?.get('__export' as any);
		assert.exists(specifier, 'specifier');
		const declaration = specifier!.declarations![0];
		assert.exists(declaration);
		assert.isTrue(ts.isExportDeclaration(declaration));
		const wrap = tsc.wrap(checker, program, declaration!);
		assert.exists(wrap);
		assert.equal(confChild, wrap!.targetFileName);
	});
	it('gets a targetFileName from a importClause', function () {
		const confChild = path.join(projectDir, 'child/child.ts');
		const specifier = sourceType.getProperty('defaultExport');
		assert.exists(specifier, 'specifier');
		const importerWrap = tsc.wrap(checker, program, specifier!);
		assert.exists(importerWrap);
		const importer = importerWrap!.localDeclaration?.declarations![0];
		assert.exists(importer, 'importer');
		assert.isTrue(ts.isImportClause(importer!));
		const wrap = tsc.wrap(checker, program, importer!);
		assert.exists(wrap);
		assert.equal(confChild, wrap!.targetFileName);
	});
	it('wraps a loner type export', function () {
		let error = '';
		errorStub = stub(log, 'error').callsFake((...args) => {
			error = args[1];
			return false;
		});
		let isTypeOnly = sourceSymbol.exports?.get('isTypeOnly' as any);
		assert.exists(isTypeOnly);
		const typeWrap = tsc.wrap(checker, program, isTypeOnly!);
		assert.equal(error, '', error);
		assert.exists(typeWrap, 'typeWrap');
	});
	it('wraps a namespace export', function () {
		const child = sourceType.getProperty('childSpace');
		assert.exists(child);
		const exportWrap = tsc.wrap(checker, program, child!);
		assert.exists(exportWrap);
		assert.exists(exportWrap!.report);
		assert.equal(exportWrap!.kind, ts.SyntaxKind.NamespaceExport);

		hasGeneratedCommonItems(
			exportWrap!,
			'childSpace',
			ts.SyntaxKind.NamespaceExport,
			ts.NodeFlags.AwaitContext,
			ts.SymbolFlags.AliasExcludes,
			ts.TypeFlags.Object,
		);

		assert.exists(exportWrap!.report);
	});
	it('wraps a local export', function () {
		const ex = sourceType.getProperty('localExport');
		const exWrap = tsc.wrap(checker, program, ex!);
		assert.exists(exWrap);
		assert.notExists(exWrap!.alias);
		assert.notExists(exWrap!.targetFileName);
		assert.exists(exWrap!.report);
	});
	it('wraps a remote export', function () {
		const remoteExport = sourceType.getProperty('child');
		assert.exists(remoteExport, 'remoteExport');
		const remoteExportWrap = tsc.wrap(checker, program, remoteExport!);
		assert.exists(remoteExportWrap);
		assert.notExists(remoteExportWrap!.alias);
		assert.exists(remoteExportWrap!.report);
	});
	it('wraps a alias export', function () {
		const alias = sourceType.getProperty('localAlias');
		assert.exists(alias, 'alias');
		const aliasWrap = tsc.wrap(checker, program, alias!);
		assert.exists(aliasWrap, 'aliasWrap');
		assert.exists(aliasWrap!.aliasedSymbol, 'aliasedSymbol');
		assert.equal(aliasWrap!.aliasedSymbol!.name, 'localDeclaration');
		assert.exists(
			aliasWrap!.immediatelyAliasedSymbol,
			'immediatelyAliasedSymbol',
		);
		assert.equal(
			aliasWrap!.immediatelyAliasedSymbol!.name,
			'localDeclaration',
		);
		assert.equal(aliasWrap!.hasValueDeclaration, false);
		assert.exists(aliasWrap!.localDeclaration, 'localTargetDeclaration');
		assert.equal(aliasWrap!.localDeclaration?.name, 'localDeclaration');
		assert.equal(aliasWrap!.alias, 'localDeclaration');

		hasGeneratedCommonItems(
			aliasWrap!,
			'localAlias',
			ts.SyntaxKind.ExportSpecifier,
			ts.NodeFlags.AwaitContext,
			ts.SymbolFlags.AliasExcludes,
			ts.TypeFlags.StringLiteral,
		);
	});
	it('wraps a function', function () {
		const fnc = sourceType.getProperty('localFunc');
		const fncWrap = tsc.wrap(checker, program, fnc!);
		assert.exists(fncWrap);
		assert.exists(fncWrap!.callSignatures);
		assert.equal(fncWrap!.callSignatures.length, 1);

		hasGeneratedCommonItems(
			fncWrap!,
			'localFunc',
			ts.SyntaxKind.FunctionDeclaration,
			ts.NodeFlags.HasImplicitReturn,
			ts.SymbolFlags.Function,
			ts.TypeFlags.Object,
		);

		assert.exists(fncWrap!.report);
	});
	it('wraps a class', function () {
		let IsClass: ts.ClassDeclaration;
		sourceFile?.forEachChild(
			(node) => ts.isClassDeclaration(node) && (IsClass = node),
		);
		assert.exists(IsClass!);
		assert.doesNotThrow(() => tsc.wrap(checker, program, IsClass!));
	});
	it('wraps a exportStar', function () {
		const confChild = path.join(projectDir, 'child/child.ts');
		assert.isTrue(tsc.isExportStar(starExport));

		const starWrap = tsc.wrap(checker, program, starExport!);
		assert.exists(starWrap);
		hasGeneratedCommonItems(
			starWrap!,
			'__export',
			ts.SyntaxKind.ExportDeclaration,
			ts.NodeFlags.None,
			ts.SymbolFlags.ExportStar,
			ts.TypeFlags.Any,
		);
		assert.equal(confChild, starWrap?.targetFileName);
	});
	it('wraps items in the factory as symbol and node', function () {
		((sourceFile as any).locals as Map<string, ts.Symbol>).forEach(
			(local) => {
				let error = '';
				errorStub = stub(log, 'error').callsFake((...args) => {
					console.log(args[1]);
					error = args[1];
					return false;
				});
				const wrap = tsc.wrap(checker, program, local);
				assert.equal(error, '', error);
				assert.exists(wrap);
				wrap!.cacheFlush();
				error = '';
				errorStub.restore();
			},
		);
		sourceSymbol.exports?.forEach((exported) => {
			let error = '';
			errorStub = stub(log, 'error').callsFake((...args) => {
				console.log(args[1]);
				error = args[1];
				return false;
			});
			const wrap = tsc.wrap(checker, program, exported);
			assert.equal(error, '', error);
			assert.exists(wrap);
			wrap!.cacheFlush();
			error = '';
			errorStub.restore();
		});
		sourceFile?.forEachChild((node) => {
			if (!Dox.isSpecifierKind(node.kind)) return;
			let error = '';
			errorStub = stub(log, 'error').callsFake((...args) => {
				console.log(args[1]);
				error = args[1];
				return false;
			});
			const wrap = tsc.wrap(checker, program, node);
			assert.equal(error, '', error);
			assert.exists(wrap);
			wrap!.cacheFlush();
			error = '';
			errorStub.restore();
		});
	});
}
function hasGeneratedCommonItems(
	wrapper: TsWrapper,
	name: string,
	kind: ts.SyntaxKind,
	nodeFlag: ts.NodeFlags,
	symbolFlags: ts.SymbolFlags,
	typeFlags: ts.TypeFlags,
) {
	const { tsNode, tsSymbol, tsType } = wrapper;

	assert.isTrue(tsNode && (ts.isSourceFile(tsNode) || Dox.isNode(tsNode)));
	assert.isTrue(tsSymbol && Dox.isSymbol(tsSymbol));
	assert.isTrue(tsType && Dox.isTypeNode(tsType));
	assert.equal(wrapper.name, name);
	assert.equal(
		kind,
		wrapper.kind,
		`kinds did not match, got ${
			wrapper.kind && ts.SyntaxKind[wrapper.kind]
		}`,
	);
	assert.equal(nodeFlag, wrapper.nodeFlag, ts.NodeFlags[wrapper.nodeFlag]);
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

function deepReportCheck(wrapper: TsWrapper) {
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
