import { menuBranch, menuMeta } from '@typedox/serialiser';
import { appendChildren, makeElement } from '../../toolBox/dom.js';
import { IconDrawer } from './Icons.js';
import { dom } from '../../index.js';
import { CategoryKind } from '../../toolBox/enumsFactory.js';

interface header {
	outer: HTMLDivElement;
	inner: HTMLDivElement;
	left: HTMLSpanElement;
	title: HTMLSpanElement;
	right: HTMLSpanElement;
	icon?: IconDrawer;
}
export class WidgetDrawer<T> extends HTMLElement {
	public depth: number;
	public name: string;
	public parent: WidgetDrawer<T> | undefined;
	public header: header;
	public childDrawers: WidgetDrawer<T>[];
	public Class: typeof WidgetDrawer<T>;
	public meta: T;

	protected drawers: HTMLDivElement;
	protected childLen: number;

	constructor(
		name: string,
		Class: typeof WidgetDrawer<T>,
		meta = {} as T,
		depth: number,
		children?: menuBranch[],
		parent?: WidgetDrawer<T>,
	) {
		super();
		this.depth = depth;
		this.name = name;
		this.parent = parent;
		this.Class = Class;
		this.meta = meta;
		this.childLen = children?.length || 0;

		this.header = this.makeDrawerHeader(name);
		this.drawers = makeElement('div', 'drawers');
		this.childDrawers = this.makeChildDrawers(children);

		appendChildren.call(this.drawers, this.childDrawers);
		if (!this.childLen) return;

		this.header.left.addEventListener('click', this.toggleOpened);
	}
	connectedCallback() {
		this.classList.add('drawer', 'closed', 'doxdrawer');
		this.appendChild(this.header.outer);
		this.appendChild(this.drawers);
	}
	disconnectedCallback() {
		this.header.left.removeEventListener('click', this.toggleOpened);
	}

	toggleOpened = (event: MouseEvent) => {
		event.stopPropagation();

		const opened = this.classList.contains('open');
		if (event.shiftKey) {
			opened ? this.closeAllChildren() : this.openAllChildren();
		} else {
			opened ? this.close() : this.open();
		}
	};
	open() {
		this.classList.add('open');
		this.header.icon?.setAttribute('state', 'open');
	}
	close() {
		this.classList.remove('open');
		this.header.icon?.setAttribute('state', 'closed');
	}
	closeAllChildren() {
		this.close();
		setTimeout(() => {
			this.childDrawers.forEach((child) => child.closeAllChildren());
		});
	}
	openAllChildren() {
		this.open();
		setTimeout(() => {
			this.childDrawers.forEach((child) => child.openAllChildren());
		});
	}
	protected makeDrawerHeader = (name: string): header => {
		let icon: IconDrawer | undefined;
		const outer = makeElement<HTMLDivElement>('div', 'header');
		const inner = makeElement<HTMLDivElement>('div');
		const left = makeElement<HTMLSpanElement>('span', 'left');
		const title = makeElement<HTMLSpanElement>('span', 'title', name);
		const right = makeElement<HTMLSpanElement>('span', 'right');

		inner.appendChild(left);
		inner.appendChild(title);
		inner.appendChild(right);
		outer.appendChild(inner);

		outer.setAttribute('children', String(this.childLen));
		if (this.childLen) {
			icon = new IconDrawer();
			left.appendChild(icon);
			left.style.cursor = 'pointer';
		}

		return { outer, inner, left, title, right, icon };
	};
	protected makeChildDrawers = (children: menuBranch[] | undefined) => {
		const accumulator = [] as WidgetDrawer<T>[];
		if (!children) return accumulator;

		return children.reduce((accumulator, childBranch) => {
			const childDrawer = this.makeChildDrawer(
				childBranch.name,
				childBranch.children,
				childBranch.meta as T,
			);
			accumulator.push(childDrawer);

			return accumulator;
		}, accumulator);
	};
	protected makeChildDrawer = (
		name: string,
		children: menuBranch[] | undefined,
		meta: T,
	) => {
		const drawer = new this.Class(
			name,
			this.Class,
			meta,
			this.depth + 1,
			children,
		);
		return drawer;
	};
}

customElements.define('widget-drawer', WidgetDrawer);
