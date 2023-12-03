import {
	CategoryKind,
	DoxEvents,
	DoxLocation,
	coreEventsApi,
} from '@typedox/core';
import { menuBranch, serialiserEventsApi } from '../index.mjs';
import { log } from '@typedox/logger';
import { mainEventsApi } from 'typedox/events';

type eventsApi = coreEventsApi & serialiserEventsApi & mainEventsApi;
const events = new DoxEvents<eventsApi>(
	coreEventsApi,
	serialiserEventsApi,
	mainEventsApi,
);
/**
 * This function does something
 */
type registryBranch = {
	menuBranch: menuBranch;
	references: Record<string, menuBranch>;
};
export class PackageMenu {
	registry = {} as Record<string, registryBranch>;
	menuTree = {} as Record<string, menuBranch>;

	constructor() {
		const { makeBranch } = PackageMenu;
		const { Package, Reference } = CategoryKind;
		events.on('core.package.declarePackage', (doxpackage) => {
			const { name, workspaces } = doxpackage;
			const menuBranch = makeBranch(name, Package, []);
			this.registry[name] = {
				menuBranch,
				references: {},
			};
			workspaces.forEach((workspace) => {
				if (!this.menuTree[workspace]) {
					log.warn(log.identifier(this), 'To investigate???');
					return;
				}
				menuBranch.children?.push(this.menuTree[workspace]);
				delete this.menuTree[workspace];
			});
			this.menuTree[name] = menuBranch;
		});
		events.on('core.reference.declareReference', (reference) => {
			const { doxPackage } = reference;
			const branch = makeBranch(reference.name, Reference, []);
			const parentBranch = this.registry[doxPackage.name].menuBranch;
			parentBranch.children?.push(branch);
			this.registry[doxPackage.name].references[reference.name] = branch;
		});

		events.on('core.declaration.related', (declaration) => {
			const {
				doxPackage,
				doxReference,
				name,
				category,
				location,
				flags,
			} = declaration;

			const references = this.registry[doxPackage.name];
			//a single ts.Reference is split over multiple npm packages
			if (!references.references[doxReference.name]) {
				const refBranch = makeBranch(doxReference.name, Reference, []);
				references.references[doxReference.name] = refBranch;
				this.registry[doxPackage.name].menuBranch.children?.push(
					refBranch,
				);
			}
			const parentBranch = references.references[doxReference.name];
			const menuBranch = makeBranch(
				name,
				category,
				[],
				location,
				flags.isExternal,
				flags.isLocal,
			);

			parentBranch.children?.push(menuBranch);
		});

		events.on('main.built.project', () => {
			const menu = Object.keys(this.menuTree).map((packageName) => {
				return PackageMenu.sortMenu(this.menuTree[packageName]);
			});
			events.emit('serialiser.packageMenu.serialised', menu);
		});
	}

	static makeBranch(
		name: string,
		category: CategoryKind,
		children?: menuBranch[],
		location?: DoxLocation,
		isExternal?: boolean,
		isLocal?: boolean,
	) {
		return {
			name,
			meta: { category, location, isExternal, isLocal },
			children,
		} as menuBranch;
	}
	static sortMenu(menu: menuBranch) {
		menu.children?.sort((a, b) => {
			const aIndex = a.meta.category + a.name;
			const bIndex = b.meta.category + b.name;
			if (aIndex === bIndex) return 0;
			return aIndex > bIndex ? 1 : -1;
		});
		menu.children?.forEach((child) => PackageMenu.sortMenu(child));

		return menu;
	}
}

/*
export function serialisePackageMenu(
	packages: Record<string, serialisedPackage>,
) {
	const accumulator = [] as menuBranch[];
	let menu = Object.keys(packages).reduce((accumulator, packageName) => {
		const packageData = packages[packageName];
		if (!packageData) return accumulator;

		const menuBranch = menuPackage(packageData);
		resolveWorkspaces(packageName, menuBranch);
		nestChildspaces(menuBranch);
		liftDuplicates(menuBranch);
		sortMenu(menuBranch);

		accumulator.push(menuBranch);
		return accumulator;
	}, accumulator);

	return menu;

	function resolveWorkspaces(packageName: string, menuBranch: menuBranch) {
		const packageData = packages[packageName];
		packageData.workspaces.forEach((workspaceName) => {
			if (workspaceName === packageName) return;

			menuBranch.children ??= [];
			const wsChild = pullChild(workspaceName, accumulator);
			if (wsChild) {
				menuBranch.children!.push(wsChild.child);
			} else if (packages[workspaceName]) {
				menuBranch.children!.push(menuPackage(packages[workspaceName]));
			}
			wsChild && accumulator.splice(wsChild.index, 1);
		});
	}
	function nestChildspaces(menuBranch: menuBranch) {
		let newChild: menuBranch | undefined;
		const replacementChildren = menuBranch.children?.reduce(
			(accumulator, child) => {
				if (!child.name) return accumulator;
				const keys = child.name.split('/');
				if (keys.length <= 1) {
					accumulator.push(child);
					nestChildspaces(child);
					return accumulator;
				}

				const indexName = keys.shift()!;
				const childName = keys.join('/');

				const newParent = pullChild(indexName, accumulator);
				newChild =
					newParent?.child ||
					makeMenuBranch(
						indexName,
						child.meta.category,
						[],
						child.meta.location,
					);

				if (!newParent) accumulator.push(newChild);

				child.name = childName;
				newChild.children?.push(child);

				return accumulator;
			},
			[] as menuBranch[],
		);
		if (newChild) nestChildspaces(newChild);
		menuBranch.children = replacementChildren;
	}
	function menuCategories(
		branch: menuBranch,
		referenceData: serialisedBranch,
	) {
		Object.keys(referenceData).forEach((referenceMemberName) => {
			const categoryName = referenceMemberName as keyof serialisedBranch;
			if (
				referenceMemberName === 'category' ||
				!referenceData[categoryName]
			)
				return;

			const categoryData = referenceData[categoryName];
			const memberNames = Object.keys(categoryData);
			memberNames.forEach((memberName) => {
				const key = memberName as keyof typeof categoryData;
				const member = categoryData[key];
				const category = member.category;
				const isNamespace = category === CategoryKind.Namespace;
				const child = isNamespace
					? makeMenuBranch(memberName, category, [])
					: makeMenuBranch(
							memberName,
							category,
							undefined,
							(member as DeclarationSerialised).location,
					  );
				branch.children ??= [];
				branch.children.push(child);
				if (!isNamespace) return;
				menuCategories(child, member as serialisedBranch);
			});
		});
		return branch;
	}
	function menuPackage(packageData: serialisedPackage) {
		let branch = makeMenuBranch(packageData.name, packageData.category);

		const references = packageData.references;
		const refKeys = Object.keys(references);
		if (!refKeys.length) return branch;

		if (refKeys.length > 1) {
			branch.children ??= [];
			refKeys.forEach((key) => {
				if (key === packageData.name) return;
				const reference = references[key];
				const childBranch = makeMenuBranch(key, reference!.category);
				branch.children?.push(menuCategories(childBranch, reference));
			});
		} else {
			branch = menuCategories(branch, references[refKeys[0]]);
		}
		return branch;
	}
	function liftDuplicates(menuBranch: menuBranch) {
		menuBranch.children = menuBranch.children?.reduce(
			(accumulator, child) => {
				let hadDupe: menuBranch | undefined;
				const { name, meta } = child;
				child.children = child.children?.filter((grandchild) => {
					const isDupe =
						grandchild.name === name &&
						grandchild.meta.category === meta.category;
					const refIsPackage =
						grandchild.name === name &&
						meta.category === CategoryKind.Package &&
						grandchild.meta.category === CategoryKind.Reference;

					if (isDupe || refIsPackage) {
						accumulator.push(grandchild);
						hadDupe = grandchild;
						return false;
					}
					return true;
				});
				if (hadDupe) {
					hadDupe.children ??= [];
					child.children?.forEach(
						(grandchild) => hadDupe?.children?.push(grandchild),
					);
				} else {
					accumulator.push(child);
				}

				liftDuplicates(child);
				return accumulator;
			},
			[] as menuBranch[],
		);
	}
	function pullChild(name: string, children: menuBranch[]) {
		const index = children.findIndex((child) => child.name === name);
		if (index < 0) return undefined;
		const child = children[index];
		return {
			index,
			child,
		};
	}
	function makeMenuBranch(
		name: string,
		category: CategoryKind,
		children?: menuBranch[],
		location?: DoxLocation,
	) {
		return { name, meta: { category, location }, children } as menuBranch;
	}
	function sortMenu(menu: menuBranch) {
		menu.children?.sort((a, b) => {
			const aIndex = a.meta.category + a.name;
			const bIndex = b.meta.category + b.name;
			if (aIndex === bIndex) return 0;
			return aIndex > bIndex ? 1 : -1;
		});
		menu.children?.forEach((child) => sortMenu(child));
	}
}
*/
