import ts from 'typescript';
import { assert } from 'chai';
import { log, logLevels } from '@typedox/logger';
import { compilerFactory, doxStub, projectFactory } from '@typedox/test';
import wrapper from '@typedox/wrapper';

const localLogLevel = logLevels.silent;

export default function () {
	before(function () {
		log.setLogLevel(doxStub.globalLogLevel || localLogLevel);
	});

	it('identifies specifierKinds', function () {
		const values = Object.values(ts.SyntaxKind)
			.map((kind) => wrapper.isSpecifierKind(kind as any))
			.filter((value) => !!value);
		assert.equal(values.length, 9);
	});
	it('processes inferred overloaded symbol declarations', function () {
		const sourcefile = projectFactory.specDoxSourceFile('overloading');
		assert.exists(sourcefile);
		const symbol = sourcefile.fileSymbol.exports?.get('overloaded' as any);
		assert.exists(symbol);
		const declared = wrapper.declared(symbol!);
		assert.exists(declared.nodes);
		assert.exists(declared.typeAlias);
		assert.exists(declared.fileName);
		assert.lengthOf(declared.nodes!, 3);
		declared.nodes?.forEach((node) => {
			assert.isTrue(ts.isFunctionDeclaration(node));
		});
		assert.isTrue(ts.isTypeAliasDeclaration(declared.typeAlias!));
		assert.equal(declared.fileName, sourcefile.fileName);
		const checker = compilerFactory('overloading').compiler().checker;
		//log.info(declared.nodes![2]);
		//log.info((declared.nodes![2] as any).symbol);
	});
	it('processes explicit overloaded symbol declarations', function () {
		const sourcefile = projectFactory.specDoxSourceFile('overloading');
		assert.exists(sourcefile);
		const symbol = sourcefile.fileSymbol.exports?.get('explicit' as any);
		assert.exists(symbol);
		const declared = wrapper.declared(symbol!);
		assert.exists(declared.nodes);
		assert.exists(declared.typeAlias);
		assert.exists(declared.fileName);
		assert.lengthOf(declared.nodes!, 3);
		declared.nodes?.forEach((node) => {
			assert.isTrue(ts.isFunctionDeclaration(node));
		});
		assert.isTrue(ts.isTypeAliasDeclaration(declared.typeAlias!));
		assert.equal(declared.fileName, sourcefile.fileName);
	});
	it('processes overloaded enum declarations', function () {
		const sourcefile = projectFactory.specDoxSourceFile('overloading');
		assert.exists(sourcefile);
		const symbol = sourcefile.fileSymbol.exports?.get('enumerator' as any);
		assert.exists(symbol);
		const declared = wrapper.declared(symbol!);
		assert.exists(declared.nodes);
		assert.notExists(declared.typeAlias);
		assert.exists(declared.fileName);
		assert.lengthOf(declared.nodes!, 3);
		declared.nodes?.forEach((node) => {
			assert.isTrue(ts.isEnumDeclaration(node));
		});
		assert.equal(declared.fileName, sourcefile.fileName);
	});
}
