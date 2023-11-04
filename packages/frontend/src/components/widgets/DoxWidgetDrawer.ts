import { menuBranch } from '@typedox/serialiser';
import { appendChildren, makeElement } from '../../utils/domFactory.js';

export class DoxWidgetDrawer extends HTMLElement {
	public depth: number;
	public name: string;
	public parent: DoxWidgetDrawer | undefined;
	public header: HTMLDivElement;
	public childDrawers: DoxWidgetDrawer[];

	private drawers: HTMLDivElement;
	private inset = 12;

	constructor(
		name: string,
		category: keyof typeof document.dox.categoryKind,
		children?: menuBranch[],
		depth = 0,
		parent?: DoxWidgetDrawer,
	) {
		super();
		this.depth = depth;
		this.name = name;
		this.parent = parent;

		this.header = makeDrawerHeader(name, category, depth, this.inset);
		this.drawers = makeElement('div', 'drawers');
		this.childDrawers = makeChildDrawers(children, depth);

		appendChildren.call(this.drawers, this.childDrawers);

		this.header.addEventListener('click', this.toggleOpened);
	}
	connectedCallback() {
		this.classList.add('drawer', 'closed');
		this.appendChild(this.header);
		this.appendChild(this.drawers);
	}
	disconnectedCallback() {
		this.header.removeEventListener('click', this.toggleOpened);
	}

	toggleOpened = (event: MouseEvent) => {
		const closed = this.classList.contains('closed');
		if (event.shiftKey) {
			closed ? this.openAllChildren() : this.closeAllChildren();
		} else {
			closed ? this.open() : this.close();
		}
	};
	open() {
		this.classList.remove('closed');
	}
	close() {
		this.classList.add('closed');
	}
	closeAllChildren() {
		this.childDrawers.forEach((child) => child.closeAllChildren());
		this.close();
	}
	openAllChildren() {
		this.open();
		this.childDrawers.forEach((child) => child.openAllChildren());
	}
}

const doxWidgetDrawer = 'dox-widget-drawer';
customElements.define(doxWidgetDrawer, DoxWidgetDrawer);

function makeDrawerHeader(
	name: string,
	category: keyof typeof document.dox.categoryKind,
	depth: number,
	inset: number,
) {
	const paddingLeft = depth * inset;
	const header = makeElement<HTMLDivElement>('div', 'header');
	const inner = makeElement<HTMLDivElement>('div');
	const titleHtml = makeElement(
		'span',
		'title',
		`[${document.dox.categoryKind[category]}] ${name}`,
	);
	inner.appendChild(titleHtml);
	inner.style.paddingLeft = paddingLeft + 'px';
	header.appendChild(inner);

	return header;
}

function makeChildDrawers(children: menuBranch[] | undefined, depth: number) {
	const accumulator = [] as DoxWidgetDrawer[];
	if (!children) return accumulator;
	return children.reduce((accumulator, childBranch) => {
		const childDrawer = makeChildDrawer(
			childBranch.name,
			childBranch.category,
			childBranch.children,
			depth,
		);
		accumulator.push(childDrawer);

		return accumulator;
	}, accumulator);
}

function makeChildDrawer(
	name: string,
	category: number,
	children: menuBranch[] | undefined,
	depth: number,
) {
	const drawer = new DoxWidgetDrawer(name, category, children, depth + 1);
	return drawer;
}
