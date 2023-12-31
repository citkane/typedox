import ts from 'typescript';
import { CategoryKind as _CategoryKind } from '@typedox/core';
import { menuBranch as _menuBranch } from '@typedox/serialiser';
import { files } from '../index.js';

export type CategoryKind = _CategoryKind;
export let CategoryKind: {
	-readonly [k in keyof typeof _CategoryKind]: (typeof _CategoryKind)[k];
} = {} as any;

export type SyntaxKind = ts.SyntaxKind;
export let SyntaxKind: {
	-readonly [k in keyof typeof ts.SyntaxKind]: (typeof ts.SyntaxKind)[k];
} = {} as any;

export async function initEnums() {
	const [categoryKindData, syntaxKindData] = await Promise.all([
		files.fetchDataFromFile<any>('assets/_categoryKind.json'),
		files.fetchDataFromFile<any>('assets/_syntaxKind.json'),
	]);
	rebuildEnum(CategoryKind, { ...categoryKindData });
	rebuildEnum(SyntaxKind, { ...syntaxKindData });
}

function rebuildEnum(target: any, data: any) {
	Object.keys(data).forEach((key) => {
		((index) =>
			!isNaN(index) &&
			((name) => {
				target[(data[name] = index)] = name;
				target[name] = index;
			})(data[index]))(parseInt(key));
	});
}
