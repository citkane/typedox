import ts, { __String } from 'typescript';
import fs from 'fs';
import {
	DoxDeclaration,
	DoxEvents,
	DoxPackage,
	DoxReference,
	config,
	coreEventsApi,
} from './index.mjs';
import { Dox } from './Dox.mjs';
import { log } from '@typedox/logger';
import path from 'path';

const __filename = log.getFilename(import.meta.url);
const events = new DoxEvents<coreEventsApi>();

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
	public doxPackage: DoxPackage;
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
		this.doxPackage = this.findDoxPackage();

		if (path.extname(this.fileName) === '.json') {
			this.json = true;
			return;
		}
		const fileMeta = DoxSourceFile.fileMeta(
			sourceFile,
			this.doxOptions.projectRootDir,
		);
		try {
			this.fileSymbol = this.checker.getSymbolAtLocation(sourceFile)!;
			this.fileType = this.checker.getTypeOfSymbol(this.fileSymbol);
			if (!this.fileSymbol || !this.fileType) throw Error();

			events.emit(
				'core.sourcefile.declareSourceFile',
				sourceFile.fileName,
				fileMeta,
			);
		} catch (error) {
			this.error = true;
			notices.fileError.call(this);
		}

		log.debug(log.identifier(this), this.fileName);
	}
	public get doxOptions() {
		return this.parent.doxOptions;
	}
	public get doxReference() {
		return this.parent;
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
			//if (this.isDuplicateSymbol(localSymbol, exports)) return;
			makeDeclaration.call(this, localSymbol, true);
		});

		function makeDeclaration(
			this: DoxSourceFile,
			item: ts.Symbol,
			local?: boolean,
		) {
			const declaration = new DoxDeclaration(this, item, local);
			if (declaration.error) return;

			this.declarationsMap.set(declaration.escapedName, declaration);
		}
	};

	public buildRelationships = () => {
		this.declarationsMap.forEach((declaration) => {
			declaration.relate();
		});
	};
	private findDoxPackage() {
		const thisDir = path.dirname(this.fileName);
		const packageDef = this.doxOptions.npmFileConvention;
		const packageName = findPackage(thisDir, packageDef);
		return this.doxProject.doxPackages.get(packageName)!;

		function findPackage(dir: string, packageDef: string) {
			const filePath = path.join(dir, packageDef);
			if (fs.existsSync(filePath)) {
				return config.jsonFileToObject(filePath).name;
			}
			return findPackage(path.join(dir, '../'), packageDef);
		}
	}
	/*
	private isDuplicateSymbol(
		needle: ts.Symbol,
		haystack: Map<__String, DoxDeclaration | ts.Symbol> = this
			.declarationsMap,
	) {
		if (!haystack.has(needle.escapedName)) return false;
		const found = haystack.get(needle.escapedName)!;
		const foundSymbol = this.isDoxDeclaration(found)
			? found.wrappedItem.tsSymbol
			: found;
		return foundSymbol === needle;
	}
*/
	public static fileMeta(sourceFile: ts.SourceFile, projectRootDir: string) {
		const regex = new RegExp(`^${projectRootDir}`);

		const filePath = sourceFile.fileName;
		const fileName = path.basename(filePath);
		const dirPath = path
			.dirname(filePath)
			.replace(regex, '')
			.replace(/\\/g, '/');

		return {
			fileName,
			dirPath,
		};
	}
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
