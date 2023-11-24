import path from 'path';
import fs from 'fs';
import {
	DoxProject,
	DoxReference,
	namedRegistry,
	config,
	DoxSourceFile,
	CategoryKind,
	events,
} from './index.mjs';
import { Dox } from './Dox.mjs';
import { log } from '@typedox/logger';
import ts from 'typescript';

const __filename = log.getFilename(import.meta.url);

/**
 * A container for all npm `package` declarations. Can be one, or many in a monorepo:
 *
 * &emsp;DoxProject\
 * &emsp;&emsp;|\
 * &emsp;&emsp;--- **DoxPackage**[]\
 * &emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;--- DoxReference[]\
 * &emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;--- DoxSourceFile[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;--- DoxDeclaration[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;--- Branch[]\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;|\
 * &emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;...DoxDeclaration...
 *
 *
 */
export class DoxPackage extends Dox {
	public doxReferences!: DoxReference[];
	public filesMap = new Map<string, DoxSourceFile>();
	public name: string;
	public version: string;
	public workspaces: string[];
	public category = CategoryKind.Package;

	private parsedConfigs: ts.ParsedCommandLine[];
	private programsRootDir: string[];
	private parent: DoxProject;
	private npmFilePath: string;

	constructor(
		parent: DoxProject,
		npmFilePath: string,
		parsedConfigs: ts.ParsedCommandLine[],
		programsRootDir: string[],
	) {
		super();

		this.parsedConfigs = parsedConfigs;
		this.programsRootDir = programsRootDir;

		const packageConfig = config.jsonFileToObject(npmFilePath);
		const { name, version, workspaces } = packageConfig;

		this.parent = parent;
		this.name = name;
		this.version = version;
		this.npmFilePath = npmFilePath;

		this.workspaces = parseWorkspacesToPackageNames(
			this.rootDir,
			workspaces,
			this.options.npmFileConvention,
		);

		events.emit('core.package.declarePackage', this);
	}

	public init = () => {
		this.logInitInfo(this.npmFilePath);
		this.doxReferences = this.makeDoxReferences(
			this.parsedConfigs,
			this.programsRootDir,
		);

		log.info(log.identifier(this), 'done', '\n');
	};
	public get options() {
		return this.doxProject.options;
	}
	public get doxProject() {
		return this.parent;
	}
	public get rootDir() {
		return path.dirname(this.npmFilePath);
	}

	private makeDoxReferences = (
		parsedConfigs: ts.ParsedCommandLine[],
		rootDirs: string[],
	) => {
		const nameSpaceMap = DoxPackage.getUniqueNameMap(
			rootDirs,
			this.options.projectRootDir,
		);
		const doxReferences = parsedConfigs.reduce(
			(accumulator, parsedConfig, i) => {
				const rootDir = rootDirs[i];
				const name = nameSpaceMap[rootDir];
				const reference = new DoxReference(
					this,
					name,
					parsedConfig,
					parsedConfigs.length,
					i,
				);
				if (reference.program) accumulator.push(reference);
				return accumulator;
			},
			[] as DoxReference[],
		);

		return doxReferences;
	};

	public static getUniqueNameMap(rootDirs: string[], projectRootDir: string) {
		projectRootDir = normalise(projectRootDir);
		const referenceNameMap = rootDirs
			.sort((a, b) => {
				const aLen = a.split('/').length;
				const bLen = b.split('/').length;

				return aLen - bLen;
			})
			.reduce((accumulator, rootDir) => {
				const name = getNameFromRootDir(rootDirs, rootDir, []).join(
					'/',
				);
				accumulator[rootDir] = name;

				return accumulator;
			}, {} as namedRegistry<string>);

		function getNameFromRootDir(
			rootDirs: string[],
			rootDir: string,
			nameAccumulator: string[],
		): string[] {
			rootDir = normalise(rootDir);
			const parents = rootDirs.filter((dir) => {
				dir = normalise(dir);
				return (
					dir !== rootDir &&
					dir !== projectRootDir &&
					rootDir.startsWith(dir)
				);
			});

			const fragments = rootDir.split('/');
			const baseName = fragments.pop();
			const atRoot =
				normalise(fragments.join('/')) === projectRootDir ||
				normalise(rootDir) === normalise(projectRootDir);
			const atEnd = !fragments.length || !parents.length;

			if (baseName && (atEnd || atRoot)) {
				nameAccumulator.unshift(baseName);
				return nameAccumulator;
			}
			const conflict =
				!!fragments.length &&
				!!parents.find((parent) =>
					parent.endsWith(fragments[fragments.length - 1]),
				);
			if (conflict && baseName) nameAccumulator.unshift(baseName);

			return getNameFromRootDir(
				rootDirs,
				fragments.join('/'),
				nameAccumulator,
			);
		}
		function normalise(string: string) {
			return string.replace(/^\/|\/$/g, '');
		}
		return referenceNameMap;
	}
	private logInitInfo(npmFilePath: string) {
		if (!this.name) {
			const packageDirPath = path.dirname(npmFilePath);
			const packageDirName = path.basename(packageDirPath);
			this.name = packageDirName;
			log.warn(
				log.identifier(this),
				`package file "${npmFilePath}" has no name. It has been renamed to "${this.name}"`,
			);
		}
		if (!this.version) {
			this.version = '0.0.0';
			log.warn(
				log.identifier(this),
				`package "${this.name}" has no version. It has been assigned "0.0.0"`,
			);
		}

		log.info(
			log.identifier(this),
			`Making package ${this.name}: ${this.version}`,
		);
	}
}

function parseWorkspacesToPackageNames(
	startDir: string,
	workspaces: string[] | undefined,
	npmFileConvention: string,
) {
	const accumulator = [] as string[];
	if (!workspaces) return accumulator;

	return workspaces.reduce((accumulator, workspacePath) => {
		const workspaceFile = path.isAbsolute(workspacePath)
			? path.join(workspacePath, npmFileConvention)
			: path.join(startDir, workspacePath, npmFileConvention);

		if (!fs.existsSync(workspaceFile)) return accumulator;
		const packageConfig = config.jsonFileToObject(workspaceFile);
		if (packageConfig.name) accumulator.push(packageConfig.name);

		return accumulator;
	}, accumulator);
}
