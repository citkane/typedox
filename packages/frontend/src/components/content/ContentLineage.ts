import { DeclarationSerialised } from '@typedox/serialiser';
import { NavLink, dom, files } from '../../index.js';

export class ContentLineage extends HTMLElement {
	private query: string;
	//private relation: HTMLElement;
	private declaration: DeclarationSerialised;
	public parentsDiv?: HTMLElement;
	public childrenDiv?: HTMLElement;
	public peersDiv: HTMLElement;

	private hasPeers: boolean;
	private parentPath: boolean;
	private childPath: boolean;

	constructor(
		declaration: DeclarationSerialised,
		isRoot = false,
		parentPath = false,
		childPath = false,
		peers?: HTMLElement,
	) {
		super();
		const { parents, children } = declaration;
		this.query = declaration.location.query;
		this.declaration = declaration;
		this.parentPath = parentPath;
		this.childPath = childPath;

		if (parents && parents.length) {
			this.parentsDiv = dom.makeElement(
				'div',
				`parents ${parents.length > 1 ? 'many' : ''}`,
			);
		}

		this.hasPeers = !!peers;
		this.peersDiv = peers ?? dom.makeElement('div', 'peers');

		const peer = isRoot
			? dom.makeElement('div', 'root', declaration.name)
			: new NavLink(declaration.name, declaration.location);

		const classes = ['relation'];
		parents && classes.push('parents');
		children && classes.push('children');
		peer.classList.add(...classes);
		this.peersDiv.appendChild(peer);

		if (children && children.length) {
			this.childrenDiv = dom.makeElement(
				'div',
				`children ${children.length > 1 ? 'many' : ''}`,
			);
		}
	}
	connectedCallback() {
		dom.appendChildren.call(this, [
			this.parentsDiv,
			!this.hasPeers ? this.peersDiv : undefined,
			this.childrenDiv,
		]);
		this.parentPath &&
			this.inherit('parents', this.parentsDiv, this.declaration.parents);
		this.childPath &&
			this.inherit(
				'children',
				this.childrenDiv,
				this.declaration.children,
			);
	}
	inherit(
		direction: 'parents' | 'children',
		targetDiv?: HTMLElement,
		relatives?: string[],
	) {
		console.log(relatives);
		if (!targetDiv || !relatives) return;
		const placeholder =
			direction === 'parents' ? this.parentsDiv : this.childrenDiv;
		relatives.forEach((query) => {
			files.fetchQueryFromFile(query).then((data) => {
				console.log(data);
				direction === 'parents'
					? delete data.children
					: delete data.parents;

				data.parents = data.parents?.filter((query) => {
					return query !== this.query;
				});
				data.children = data.children?.filter((query) => {
					return query !== this.query;
				});
				const relative = new ContentLineage(
					data,
					false,
					direction === 'parents',
					direction === 'children',
				);
				placeholder?.appendChild(relative);
				/*
				switch (placeholder) {
					case 'parents':
						this.parentsDiv?.appendChild(relative);
						break;
					case 'children':
						this.childrenDiv?.appendChild(relative);
						break;
					default:
						this.appendChild(relative);
						break;
				}
				*/
			});
		});
	}
}

customElements.define('content-lineage', ContentLineage);
