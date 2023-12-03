import path from 'node:path';
import fs from 'node:fs';
import ts from 'typescript';
import { log } from '@typedox/logger';
import {
	DoxProject,
	DoxReference,
	config,
	CategoryKind,
	events,
	Dox,
} from './index.mjs';

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
		this.parent = parent;
		(({ name, version, workspaces }) => {
			this.name = name;
			this.version = version;
			this.npmFilePath = npmFilePath;
			this.workspaces = DoxPackage.parseWorkspacesToPackageNames(
				this.rootDir,
				workspaces,
				this.options.npmFileConvention,
			);
		})(config.jsonFileToObject(npmFilePath));
	}

	public init = async () => {
		events.emit('core.package.declarePackage', this);
		this.logInitInfo(this.npmFilePath);
		this.makeDoxReferences(this.parsedConfigs, this.programsRootDir);
		log.info(log.identifier(this), 'Done making Typedox package', '\n');
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
		((nameSpaceMap) => {
			parsedConfigs.forEach((parsedConfig, i) => {
				new DoxReference(
					this,
					name(nameSpaceMap, i),
					parsedConfig,
					parsedConfigs.length,
					i,
				);
			});
		})(DoxPackage.getUniqueNameMap(rootDirs, this.options.projectRootDir));
		function name(nameSpaceMap: Record<string, string>, i: number) {
			return ((rootDir) => nameSpaceMap[rootDir])(rootDirs[i]);
		}
	};
	private logInitInfo(npmFilePath: string) {
		if (!this.name) {
			this.name = getNameFromPath();
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

		function getNameFromPath() {
			return ((packageDirPath) => path.basename(packageDirPath))(
				path.dirname(npmFilePath),
			);
		}
	}
	private static getUniqueNameMap(
		rootDirs: string[],
		projectRootDir: string,
	) {
		return rootDirs
			.sort((a, b) => dirDepth(a) - dirDepth(b))
			.reduce(
				(accumulator, rootDir) =>
					((name) => {
						accumulator[rootDir] = name;
						return accumulator;
					})(getNameFromRootDir(rootDirs, rootDir, []).join('/')),
				{} as Record<string, string>,
			);

		function dirDepth(dir: string) {
			return dir.split('/').length;
		}
		function getNameFromRootDir(
			rootDirs: string[],
			rootDir: string,
			nameAccumulator: string[],
		): string[] {
			return (({ parentDirs, baseName, atEnd, atRoot, fragments }) => {
				if (baseName && (atEnd || atRoot)) {
					nameAccumulator.unshift(baseName);
					return nameAccumulator;
				}
				return ((conflict) => {
					if (conflict && baseName) nameAccumulator.unshift(baseName);
					return getNameFromRootDir(
						rootDirs,
						fragments.join('/'),
						nameAccumulator,
					);
				})(isRootName(fragments, parentDirs));
			})(normalisedState());

			function isRootName(fragments: string[], parentDirs: string[]) {
				return (
					!!fragments.length &&
					!!parentDirs.find((parent) =>
						parent.endsWith(fragments[fragments.length - 1]),
					)
				);
			}
			function normalisedState() {
				return ((rootDir) =>
					((parentDirs) =>
						((fragments) =>
							((baseName) =>
								((atRoot) =>
									((atEnd) => {
										return {
											fragments,
											parentDirs,
											baseName,
											atRoot,
											atEnd,
										};
									})(atEnd(fragments, parentDirs)))(
									atRoot(fragments),
								))(baseName(fragments)))(fragments(rootDir)))(
						parentDirs(rootDir),
					))(normalise(rootDir));
			}
			function atEnd(fragments: string[], parentDirs: string[]) {
				return !fragments.length || !parentDirs.length;
			}
			function atRoot(fragments: string[]) {
				return (
					normalise(fragments.join('/')) === projectRootDir ||
					normalise(rootDir) === normalise(projectRootDir)
				);
			}
			function baseName(fragments: string[]) {
				return fragments.pop();
			}
			function fragments(rootDir: string) {
				return rootDir.split('/');
			}
			function parentDirs(normalisedRootDir: string) {
				return rootDirs.filter((dir) => {
					return ((dir) => {
						return (
							dir !== normalisedRootDir &&
							dir !== projectRootDir &&
							normalisedRootDir.startsWith(dir)
						);
					})(normalise(dir));
				});
			}
			function normalise(string: string) {
				return string.replace(/^\/|\/$/g, '');
			}
		}
	}
	private static parseWorkspacesToPackageNames(
		startDir: string,
		workspaces: string[] | undefined,
		npmFileConvention: string,
	) {
		if (!workspaces) return [] as string[];

		return workspaces.reduce((accumulator, workspacePath) => {
			return ((packageConfig) => {
				if (!packageConfig) return accumulator;
				accumulator.push(packageConfig.name);
				return accumulator;
			})(getPackageConfig(workspacePath));
		}, [] as string[]);

		function getPackageConfig(workspacePath: string) {
			return ((workspaceFile) => {
				return fs.existsSync(workspaceFile)
					? config.jsonFileToObject(workspaceFile)
					: undefined;
			})(
				path.isAbsolute(workspacePath)
					? path.join(workspacePath, npmFileConvention)
					: path.join(startDir, workspacePath, npmFileConvention),
			);
		}
	}
}
