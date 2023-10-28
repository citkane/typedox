import ts from 'typescript';
import { DoxEvents } from '../events/DoxEvents.mjs';
import { log } from '@typedox/logger';

import {
	DoxBranch,
	DoxDeclaration,
	DoxPackage,
	DoxProject,
	DoxReference,
	DoxSourceFile,
	events,
} from '../index.mjs';

const __filename = log.getFilename(import.meta.url);

/** get a handle for future jsconfig etc fun */
export const tsFileSpecifier = 'tsconfig';
const EventEmitter = new DoxEvents();

let uid = 0;

export class Dox {
	public defaultStrings = ['default', 'export='];
	public get id() {
		const id = uid;
		uid++;
		return id;
	}
	public get eventCb() {
		return events.eventsApi;
	}
	public get once() {
		return EventEmitter.once;
	}
	public get on() {
		return EventEmitter.on;
	}
	public get off() {
		return EventEmitter.off;
	}
	public get emit() {
		return EventEmitter.emit;
	}

	protected isDoxProject = Dox.isDoxProject;
	protected isDoxPackage = Dox.isDoxPackage;
	protected isDoxReference = Dox.isDoxReference;
	protected isDoxDeclaration = Dox.isDoxDeclaration;
	protected isDoxSourceFile = Dox.isDoxSourceFile;
	protected isDoxBranch = Dox.isDoxBranch;

	public static isDoxProject(item: Dox): item is DoxProject {
		return item.constructor && item.constructor.name === 'DoxProject';
	}
	public static isDoxPackage(item: Dox): item is DoxPackage {
		return item.constructor && item.constructor.name === 'DoxPackage';
	}
	public static isDoxReference(item: Dox): item is DoxReference {
		return item.constructor && item.constructor.name === 'DoxReference';
	}
	public static isDoxDeclaration(item: Dox): item is DoxDeclaration {
		return item.constructor && item.constructor.name === 'DoxDeclaration';
	}
	public static isDoxSourceFile(item: Dox): item is DoxSourceFile {
		return item.constructor && item.constructor.name === 'DoxSourceFile';
	}
	public static isDoxBranch(item: Dox): item is DoxBranch {
		return item.constructor && item.constructor.name === 'DoxBranch';
	}
	/*
	public static isSymbol(item: any): item is ts.Symbol {
		return item.constructor && item.constructor.name === 'SymbolObject';
	}
	public static isNode(item: any): item is ts.Node {
		if (!item.constructor) return false;
		return (
			item.constructor.name === 'NodeObject' ||
			item.constructor.name === 'IdentifierObject'
		);
	}
	public static isTypeNode(item: any): item is ts.Type {
		return item.constructor && item.constructor.name === 'TypeObject';
	}
	public static isNodeOrSymbol(item: any): item is ts.Node | ts.Symbol {
		return Dox.isSymbol(item) || Dox.isNode(item);
	}
*/
}
