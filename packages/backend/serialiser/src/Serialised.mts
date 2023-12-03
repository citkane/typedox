import ts from 'typescript';
import { mainEventsApi } from 'typedox/events';
import { serialiseComments } from './commentsAndTags/commentsAndTags.mjs';
import { serialiseType } from './types/types.mjs';
import {
	DeclarationSerialised,
	declarationBundle,
	filePositions,
	serialiserEventsApi,
} from './index.mjs';
import {
	DeclarationFlags,
	DoxDeclaration,
	DoxEvents,
	DoxReference,
	DoxSourceFile,
	coreEventsApi,
} from '@typedox/core';
import { log } from '@typedox/logger';

type eventsApi = mainEventsApi & serialiserEventsApi & coreEventsApi;
const events = new DoxEvents<eventsApi>(
	mainEventsApi,
	serialiserEventsApi,
	coreEventsApi,
);

const register = new Map<
	string,
	Record<string, Record<string, declarationBundle>>
>();
events.on('core.reference.done', saveBundle);

export class Serialised {
	public serialised: DeclarationSerialised;

	constructor(declaration: DoxDeclaration) {
		const { valueNode, wrappedItem, category, doxOptions, name, location } =
			declaration;
		const [packageKey, referenceKey, typeKey, categoryKey, nameKey] =
			location.query.split('.');
		const bundleKey = `${packageKey}/${referenceKey}`;
		if (!register.has(bundleKey)) {
			register.set(bundleKey, {});
		}
		const bundle = register.get(bundleKey)!;
		bundle[typeKey] ??= {};
		bundle[typeKey][categoryKey] ??= {} as declarationBundle;

		const flags = serialiseFlags(declaration.flags);
		const type = serialiseType(declaration);
		const jsDocs = serialiseComments(wrappedItem);
		const file = makeFileInfo(valueNode, doxOptions.projectRootDir);
		const children = Array.from(declaration.children.values()).map(
			(declaration) => declaration.location.query,
		);
		const parents = Array.from(declaration.parents.keys()).map(
			(declaration) => declaration.location.query,
		);
		this.serialised = bundle[typeKey][categoryKey][nameKey] = {
			name,
			category,
			flags,
			location,
			type,
			jsDocs,
			file,
			children: children.length ? children : undefined,
			parents: parents.length ? parents : undefined,
		};
	}
}
function saveBundle(reference: DoxReference) {
	const packageKey = reference.doxPackage.name;
	const bundleKey = `${packageKey}/${reference.name}`;
	if (!register.has(bundleKey)) return;
	const kindRegister = register.get(bundleKey)!;

	Object.keys(kindRegister).forEach((kindKey) => {
		const kinds = kindRegister[kindKey];
		Object.keys(kinds).forEach((categoryKey) => {
			const bundle = kinds[categoryKey];
			events.emit(
				'serialiser.declarations.bundled',
				`${bundleKey}.${kindKey}.${categoryKey}`,
				bundle,
			);
		});
	});
	register.delete(bundleKey);
}
function serialiseFlags(flags: DeclarationFlags) {
	const serialised = { ...flags };
	serialised.type = serialised.type
		? ts.TypeFlags[flags.type as ts.TypeFlags]
		: undefined;

	return serialised;
}
function makeFileInfo(node: ts.Node, projectRootDir: string) {
	const positions = [] as filePositions;
	//const { tsNode, tsSymbol } = wrappedItem;

	const sourceFile = node.getSourceFile();
	const fileText = sourceFile.getFullText();
	const declarations = (node as any).symbol?.declarations;
	const values = !!declarations ? (declarations as ts.Node[]) : [node];

	values
		?.reduce((accumulator, node) => {
			const start = node.getFullStart();
			const end = start + node.getFullWidth();
			const startLine = fileText.substring(0, start).split('\n').length;
			const endLine = fileText.substring(0, end).split('\n').length;

			accumulator.push([start, end, startLine, endLine]);
			return accumulator;
		}, positions)
		.sort((a, b) => (a[0] < b[0] ? -1 : 1));

	const { fileName, dirPath } = DoxSourceFile.fileMeta(
		sourceFile,
		projectRootDir,
	);

	return {
		positions,
		fileName,
		dirPath,
	};
}
