import path from 'path';
import fs from 'fs';
import { projectFactory } from './projectFactory.mjs';
import { factoryFolders, projectFactoryDir } from '../test.stubs.mjs';
import { log } from '@typedox/logger';
import { DoxDeclaration } from '@typedox/core';
import { __String } from 'typescript';

const __filename = log.getFilename(import.meta.url);

export function declarationFactory(
	factory: factoryFolders,
	key: __String,
	file: string = 'index.ts',
): DoxDeclaration {
	const fileName = path.join(projectFactoryDir, factory, file);
	if (!fs.existsSync(fileName))
		log.throwError(log.identifier(__filename), 'not found:', fileName);

	const sourceFile = projectFactory.specDoxSourceFile(
		factory,
		undefined,
		file,
		true,
	);
	const declarationsMap = sourceFile.declarationsMap;
	//log.info(sourceFile.sourceFile);
	if (!declarationsMap.has(key))
		log.throwError(
			log.identifier(__filename),
			'declaration not found:',
			key,
			'in:',
			fileName,
		);

	return declarationsMap.get(key)!;
}

/*
const makeFiles = (factory: factoryFolders) => {
	const files: Record<string, DoxSourceFile> = {
		specifiers: projectFactory.specDoxSourceFile(factory),
		child: projectFactory.specDoxSourceFile(
			factory,
			undefined,
			'./child/child.ts',
			true,
		),
		grandchild: projectFactory.specDoxSourceFile(
			factory,
			undefined,
			'./grandchild/grandchild.ts',
			true,
		),
		exportEqual: projectFactory.specDoxSourceFile(
			factory,
			undefined,
			'./exportEqual/exportEqual.ts',
			true,
		),

		common: projectFactory.specDoxSourceFile(
			factory,
			undefined,
			'./common/common.ts',
			true,
		),
	};
	[
		'Array',
		'ArrowFunction',
		'Class',
		'ClassInstance',
		'Enum',
		'Function',
		'Object',
		'String',
		'Symbol',
		'Type',
	].forEach((name) => {
		files[`default${name}`] = projectFactory.specDoxSourceFile(
			factory,
			undefined,
			`./common/default/${
				name.charAt(0).toLowerCase() + name.slice(1)
			}.ts`,
			true,
		);
	});
	return files;
};

*/
