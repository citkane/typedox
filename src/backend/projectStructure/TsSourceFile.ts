import * as ts from 'typescript';
import {
	DoxConfig,
	TsDeclaration,
	TsReference,
	TscWrapper,
	declarationMap,
	logger as log,
	tsc,
} from '../typedox';

/**
 * A container for typescript compiler source files:
 *
 * &emsp;DoxProject\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- NpmPackage[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- TsReference[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- **TsSourceFile**[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- TsDeclaration[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- Branch[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...TsDeclaration...
 */
export class TsSourceFile extends DoxConfig {
	public parent: TsReference;
	public childFiles: string[];
	public fileName: string;
	public fileSymbol: ts.Symbol;
	public fileType: ts.Type;
	public declarationsMap: declarationMap = new Map();
	public source: ts.SourceFile;
	public checker: ts.TypeChecker;
	public tsWrap: TsReference['tsWrap'];

	constructor(
		parent: TsReference,
		source: ts.SourceFile,
		fileSymbol: ts.Symbol,
	) {
		super();
		this.parent = parent;
		this.checker = parent.checker;
		this.tsWrap = parent.tsWrap;
		this.source = source;
		this.fileName = source.fileName;
		this.fileSymbol = fileSymbol;
		this.fileType = this.checker.getTypeOfSymbol(this.fileSymbol);
		this.childFiles = this.discoverChildFiles();

		log.debug(log.identifier(this), this.fileName);
	}

	/*
	public getModuleDeclarationSymbols = () => {
		return this.fileExportsArray
			.filter(
				(symbol) =>
					symbol.valueDeclaration &&
					ts.isModuleDeclaration(symbol.valueDeclaration),
			)
			.map((symbol) => {
				const body = (symbol.valueDeclaration as ts.ModuleDeclaration)
					?.body! as any;
				return (body.statements as ts.ExpressionStatement[]).map(
					(statement) => {
						return statement.expression?.getText();
					},
				);
			})
			.flat()
			.map((name) => {
				return (this.source as any).locals.get(name)! as ts.Symbol;
			})
			.filter((val) => !!val);
	};
	private getModuleDeclarationImports = () => {
		return this.getModuleDeclarationSymbols().reduce(
			(accumulator, symbol) => {
				const value = this.tsWrap(symbol)!.tsNode;
				const isImport =
					ts.isImportClause(value) ||
					ts.isImportDeclaration(value) ||
					ts.isImportSpecifier(value);
				isImport && accumulator.push(symbol);

				return accumulator;
			},
			[] as ts.Symbol[],
		);
	};
	*/

	private get fileExportsArray() {
		const exports = this.fileSymbol.exports!.values();
		return Array.from(exports);
	}
	private discoverChildFiles = (fileSymbols = this.fileExportsArray) => {
		const moduleFileSymbols = getModuleExports.call(this, fileSymbols);

		let allFileSymbols = [...moduleFileSymbols, ...fileSymbols];

		const childFileNames = allFileSymbols
			.map(fileNamesFromSymbol.bind(this))
			.reduce(deDupe, [] as string[]);
		return childFileNames;

		function deDupe(accumulator: string[], fileNames: string[]) {
			fileNames.forEach((fileName) => {
				const addIt = !!fileName && !accumulator.includes(fileName);
				addIt && accumulator.push(fileName);
			});
			return accumulator;
		}
		function fileNamesFromSymbol(
			this: TsSourceFile,
			symbol: ts.Symbol,
		): string[] {
			if (symbol.name === 'greatGrandchild') {
				log.infoKind(symbol.valueDeclaration!.kind);
			}
			return symbol.flags === ts.SymbolFlags.ExportStar
				? this.discoverChildFiles(discoverReExports.call(this, symbol))
				: [this.tsWrap(symbol).targetFileName!];
		}

		function getModuleExports(
			this: TsSourceFile,
			symbols: ts.Symbol[],
			accumulator = [] as ts.Symbol[],
		) {
			const moduleSymbols = [] as ts.Symbol[];
			return symbols
				.map((symbol) => this.tsWrap(symbol))
				.filter((get) => ts.isModuleDeclaration(get.tsNode))
				.reduce(moduleReducer.bind(this), accumulator);

			function moduleReducer(
				this: TsSourceFile,
				accumulator: ts.Symbol[],
				get: TscWrapper,
			) {
				const module = get.tsNode as ts.ModuleDeclaration;
				const statements = (module.body as any)?.statements as
					| (ts.ExpressionStatement | ts.Node)[]
					| undefined;
				statements?.forEach(symbolExtractor.bind(this));
				getModuleExports.call(this, moduleSymbols, accumulator);
				return accumulator;
			}
			function symbolExtractor(this: TsSourceFile, node: ts.Node) {
				if (!ts.isExpressionStatement(node)) return;

				const get = this.tsWrap(node.expression);
				const aliasSymbol = get.aliasedSymbol;
				aliasSymbol
					? accumulator.push(aliasSymbol)
					: moduleSymbols.push(get.tsSymbol);
			}
		}
		function discoverReExports(this: TsSourceFile, symbol: ts.Symbol) {
			return Array.from(symbol.declarations?.values() || [])
				.map((declaration) => {
					if (
						!ts.isExportDeclaration(declaration) ||
						!declaration.moduleSpecifier
					)
						return undefined;
					const get = this.tsWrap(declaration.moduleSpecifier);
					return get.tsSymbol;
				})
				.filter((symbol) => !!symbol) as ts.Symbol[];
		}
	};
	public discoverDeclarations = (symbol = this.fileSymbol) => {
		symbol.exports?.forEach(this.makeDeclaration);

		/*
		function parseSymbol(this: TsSourceFile, symbol: ts.Symbol): void {
			//const type = this.checker.getTypeOfSymbol(symbol);
			if (symbol.flags === ts.SymbolFlags.ExportStar) {
				return this.discoverReExports(symbol).forEach((symbol) =>
					parseSymbol.call(this, symbol),
				);
			}

			const get = this.tsWrap(symbol);

			ts.isImportEqualsDeclaration(get.tsNode)
				? discoverImportEquals.call(this, get)
				: ts.isExportAssignment(get.tsNode)
				? discoverExportAssignment.bind(this)(get)
				: makeDeclaration.call(this, symbol);

			notices.discover.declarations.debug.call(this, symbol);
		}
		function discoverImportEquals(this: TsSourceFile, get: TscWrapper) {
			get.aliasedSymbol.exports?.forEach((symbol) => {
				parseSymbol.call(this, symbol);
			});
		}

		function discoverExportAssignment(this: TsSourceFile, get: TscWrapper) {
			makeDeclaration.call(this, get.tsSymbol);
			//parseSymbol.call(this, get.aliasedSymbol);
			
			const identifier = (symbol.valueDeclaration as any)
				?.expression as ts.Identifier;

			const targetSymbol =
				identifier && this.checker?.getSymbolAtLocation(identifier);

			targetSymbol?.exports?.forEach((symbol) => {
				parseSymbol.call(this, symbol);
			});
			
		}
*/
	};
	public makeDeclaration = (item: ts.Symbol) => {
		//if (!this.validateSpecifier(item)) return;

		const declaration = new TsDeclaration(this, item);
		this.declarationsMap.set(declaration.name, declaration);

		return declaration;
	};
	public buildRelationships = () => {
		this.declarationsMap.forEach((declaration) => {
			declaration.mapRelationships();
		});
	};
}
const notices = {
	discover: {
		declarations: {
			debug: function (this: TsSourceFile, symbol: ts.Symbol) {
				log.debug(
					log.identifier(this),
					'Discovering a declaration:',
					symbol.name,
					`[${ts.SymbolFlags[symbol.flags]}]`,
				);
			},
		},
	},
};
