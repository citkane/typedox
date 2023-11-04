import { CategoryKind } from '@typedox/core';
import { menuBranch } from '@typedox/serialiser';
import ts from 'typescript';
import { fetchDataFromFile } from './utils/_index.js';
import { DoxApp } from './index.js';

type categoryKind = {
	[key in keyof typeof CategoryKind | number]:
		| number
		| keyof typeof CategoryKind;
};
declare global {
	interface Document {
		dox: {
			mainMenu: menuBranch;
			categoryKind: categoryKind;
			SyntaxKind: ts.SyntaxKind;
		};
	}
}

export * from './components/_index.js';

const doxApp = (async function () {
	const promises = [
		fetchDataFromFile<menuBranch>('assets/_mainMenu.json'),
		fetchDataFromFile<categoryKind>('assets/_categoryKind.json'),
		fetchDataFromFile<ts.SyntaxKind>('assets/_syntaxKind.json'),
	];
	const [mainMenu, CategoryKind, SyntaxKind] = (await Promise.all(
		promises,
	)) as [menuBranch, categoryKind, ts.SyntaxKind];
	document.dox = {
		mainMenu,
		categoryKind: CategoryKind,
		SyntaxKind,
	};
	const doxApp = new DoxApp();
	document.body.appendChild(doxApp);
})();

export default doxApp;
