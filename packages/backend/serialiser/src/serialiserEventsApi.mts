import { Serialised, declarationBundle, menuBranch } from './index.mjs';

export type serialiserEventsApi = typeof serialiserEventsApi;
export const serialiserEventsApi = {
	'serialiser.packageMenu.serialised': packageMenuSerialised,
	'serialiser.declaration.serialised': declarationSerialised,
	'serialiser.declarations.bundled': declarationBundled,
};

function packageMenuSerialised(menu: menuBranch[]) {}
function declarationSerialised(declaration: Serialised['serialised']) {}
function declarationBundled(key: string, bundle: declarationBundle) {}
