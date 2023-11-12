import ts, { __String } from 'typescript';

import { DoxDeclaration, DoxReference } from './index.mjs';
import { Dox } from './Dox.mjs';
import { log } from '@typedox/logger';
import path from 'path';

const __filename = log.getFilename(import.meta.url);

/**
 * A container for typescript compiler source files:
 *
 * &emsp;DoxProject\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- DoxPackage[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- DoxReference[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- **TsSourceFile**[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- DoxDeclaration[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- Branch[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...DoxDeclaration...
 */
export class DoxSourceFile extends Dox {
	//public childFiles: string[];
	public fileName: string;
	public fileSymbol!: ts.Symbol;
	public fileType!: ts.Type;
	public declarationsMap = new Map<__String, DoxDeclaration>();
	public sourceFile: ts.SourceFile;
	public checker: ts.TypeChecker;
	public error = false;
	public json = false;

	private parent: DoxReference;
	constructor(parent: DoxReference, sourceFile: ts.SourceFile) {
		super();
		this.parent = parent;
		this.checker = parent.checker;
		this.sourceFile = sourceFile;
		this.fileName = path.resolve(sourceFile.fileName);
		if (path.extname(this.fileName) === '.json') {
			this.json = true;
			return;
		}
		try {
			this.fileSymbol = this.checker.getSymbolAtLocation(sourceFile)!;
			this.fileType = this.checker.getTypeOfSymbol(this.fileSymbol);
			if (!this.fileSymbol || !this.fileType) throw Error();
		} catch (error) {
			this.error = true;
			notices.fileError.call(this);
		}

		log.debug(log.identifier(this), this.fileName);
	}
	public get doxReference() {
		return this.parent;
	}
	public get doxPackage() {
		return this.parent.doxPackage;
	}
	public get doxProject() {
		return this.parent.doxProject;
	}
	public get tsWrap() {
		return this.doxReference.tsWrap;
	}
	public discoverDeclarations = () => {
		const exports = this.fileSymbol.exports;
		const locals = (this.sourceFile as any).locals as
			| Map<string, ts.Symbol>
			| undefined;
		exports?.forEach((exportSymbol) =>
			makeDeclaration.call(this, exportSymbol),
		);
		locals?.forEach((localSymbol) => {
			if (exports?.has(localSymbol.escapedName)) return;
			makeDeclaration.call(this, localSymbol, true);
		});

		function makeDeclaration(
			this: DoxSourceFile,
			item: ts.Symbol,
			local?: boolean,
		) {
			if (
				this.declarationsMap.has(item.escapedName) ||
				(item.declarations && ts.isBindingElement(item.declarations[0]))
			)
				return;

			const declaration = new DoxDeclaration(this, item, local);
			if (declaration.error) return;

			this.declarationsMap.set(declaration.escapedName, declaration);
		}
	};
	public buildRelationships = () => {
		this.declarationsMap.forEach((declaration) => {
			const { relate, wrappedItem } = declaration;
			relate(wrappedItem);
		});
	};
}

const notices = {
	fileError(this: DoxSourceFile) {
		log.error(
			log.identifier(this),
			'Could not get a ts.Symbol and ts.Type for the ts.SourceFile:',
			this.fileName,
		);
	},
};
