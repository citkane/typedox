import { CategoryKind } from '@typedox/core';
import {
	DoxLocation,
	DeclarationSerialised,
	menuBranch,
	serialisedBranch,
	serialisedPackage,
} from '../index.mjs';

export function serialiseMainMenu(packages: Record<string, serialisedPackage>) {
	const accumulator = [] as menuBranch[];
	let menu = Object.keys(packages).reduce((accumulator, packageName) => {
		const packageData = packages[packageName];
		if (!packageData) return accumulator;

		const menuBranch = menuPackage(packageData);
		accumulator.push(menuBranch);

		resolveWorkspaces(packageName, menuBranch);

		return accumulator;
	}, accumulator);
	const packageMenu = makeMenuBranch(
		'packages',
		CategoryKind.menuHeader,
		menu,
	);

	nestChildspaces(packageMenu);
	liftDuplicates(packageMenu);

	return packageMenu;

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
