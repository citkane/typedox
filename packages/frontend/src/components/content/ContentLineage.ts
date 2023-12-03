import { DeclarationSerialised } from '@typedox/serialiser';
import { NavLink, dom, files, state } from '../../index.js';

type direction = 'parents' | 'children';

export class ContentLineage extends HTMLElement {
	public parentsDiv?: HTMLElement;
	public childrenDiv?: HTMLElement;
	public peerDiv: HTMLElement;

	private declaration: DeclarationSerialised;
	private parentPath: boolean;
	private childPath: boolean;

	constructor(
		declaration: DeclarationSerialised,
		isRoot = false,
		parentPath = false,
		childPath = false,
	) {
		super();
		const { parents, children } = declaration;
		this.declaration = declaration;
		this.parentPath = parentPath;
		this.childPath = childPath;

		this.parentsDiv = self.relationsDiv(parents, 'parents');
		this.peerDiv = self.peerDiv(isRoot, parents, children, declaration);
		this.childrenDiv = self.relationsDiv(children, 'children');
	}
	connectedCallback() {
		dom.appendChildren.call(this, [
			this.parentsDiv,
			this.peerDiv,
			this.childrenDiv,
		]);
		this.parentPath &&
			this.inherit('parents', this.declaration, this.parentsDiv);
		this.childPath &&
			this.inherit('children', this.declaration, this.childrenDiv);
	}
	private inherit(
		direction: direction,
		declaration: DeclarationSerialised,
		targetDiv?: HTMLElement,
	) {
		if (!targetDiv || !declaration[direction]) return;

		((queries) =>
			queries?.forEach((query) => {
				files.fetchQueryFromFile(query).then((data) => {
					this.inheritContainer(direction)!.insertBefore(
						((data) => self.createNewRelative(data, direction))(
							((data) => self.unRecurseRelative(data, query))(
								((data) =>
									self.emancipateRelatives(data, direction))({
									...data,
								}),
							),
						),
						this.inheritContainer(direction)!.lastChild,
					);
				});
			}))(
			self.pruneRelatives({ ...declaration }, direction, 10, targetDiv)[
				direction
			],
		);
	}
	private inheritContainer = (direction: direction) =>
		direction === 'parents' ? this.parentsDiv : this.childrenDiv;

	private static createNewRelative(
		data: DeclarationSerialised,
		direction: direction,
	) {
		return new ContentLineage(
			data,
			false,
			direction === 'parents',
			direction === 'children',
		);
	}
	private static pruneRelatives(
		declaration: DeclarationSerialised,
		direction: direction,
		maxLen: number,
		container: HTMLElement,
	) {
		return ((pruneLen) => {
			if (!pruneLen || pruneLen < maxLen) return declaration;
			declaration[direction] = declaration.children?.slice(0, maxLen);
			container.appendChild(
				new ContentLineage(
					{
						name: `...and [${pruneLen}] more`,
					} as DeclarationSerialised,
					true,
				),
			);
			return declaration;
		})(declaration[direction] && declaration[direction]!.length - maxLen);
	}
	private static unRecurseRelative(
		data: DeclarationSerialised,
		relatedQuery: string,
	) {
		data.parents = data.parents?.filter((query) => query !== relatedQuery);
		data.children = data.children?.filter(
			(query) => query !== relatedQuery,
		);
		return data;
	}
	private static emancipateRelatives(
		data: DeclarationSerialised,
		direction: direction,
	) {
		direction === 'parents'
			? (data.children = !!data.children ? [] : undefined)
			: (data.parents = !!data.parents ? [] : undefined);

		return data;
	}
	private static peerClasses(
		parents: string[] | undefined,
		children: string[] | undefined,
	) {
		return ((classes) => {
			!!(parents && parents.length) && classes.push('hasparent');
			!!(children && children.length) && classes.push('haschild');
			return classes;
		})(['relation']);
	}
	private static peerDiv(
		isRoot: boolean,
		parents: string[] | undefined,
		children: string[] | undefined,
		declaration: DeclarationSerialised,
	) {
		return ((classes) =>
			isRoot
				? self.addClassesToElement(
						dom.makeElement('div', 'root', declaration.name),
						classes,
				  )
				: self.addClassesToElement(
						new NavLink(declaration.name, declaration.location),
						classes,
				  ))(self.peerClasses(parents, children));
	}
	private static addClassesToElement(
		element: HTMLElement,
		classes: string[],
	) {
		element.classList.add(...classes);
		return element;
	}
	private static relationsDiv(relatives: string[] | undefined, key: string) {
		if (!relatives || !relatives.length) return undefined;
		return dom.makeElement(
			'div',
			`${key} ${relatives.length > 1 ? 'many' : ''}`,
		);
	}
}
const self = ContentLineage;
customElements.define('content-lineage', ContentLineage);
