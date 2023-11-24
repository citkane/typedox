import { menuBranch } from '@typedox/serialiser';
import { IconDrawer } from './ClassesIcons.js';
import { dom, state } from '../../index.js';

interface header {
	outer: HTMLDivElement;
	inner: HTMLDivElement;
	left: HTMLSpanElement;
	title: HTMLSpanElement;
	right: HTMLSpanElement;
	icon?: IconDrawer;
}

let id = 0;
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

	private did: number;

	constructor(
		name: string,
		Class: typeof WidgetDrawer<T>,
		meta = {} as T,
		depth: number,
		children?: menuBranch[],
		parent?: WidgetDrawer<T>,
	) {
		super();
		this.did = id;
		id++;

		this.depth = depth;
		this.name = name;
		this.parent = parent;
		this.Class = Class;
		this.meta = meta;
		this.childLen = children?.length || 0;

		this.header = this.makeDrawerHeader(name);
		this.drawers = dom.makeElement('div', 'drawers');
		this.childDrawers = this.makeChildDrawers(children);

		dom.appendChildren.call(this.drawers, this.childDrawers);
		if (!this.childLen) return;

		this.header.left.addEventListener('click', this.toggleOpened);
	}
	connectedCallback() {
		this.classList.add('drawer', 'doxdrawer');
		this.appendChild(this.header.outer);
		this.appendChild(this.drawers);
		state.menuDrawers(this.did) ? this.open() : this.close();
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
		this.classList.remove('closed');
		this.classList.add('open');
		this.header.icon?.setAttribute('state', 'open');
		state.menuDrawer = [this.did, true];
	}
	close() {
		this.classList.remove('open');
		this.classList.add('closed');
		this.header.icon?.setAttribute('state', 'closed');
		state.menuDrawer = [this.did, false];
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
		const outer = dom.makeElement<HTMLDivElement>('div', 'header');
		const inner = dom.makeElement<HTMLDivElement>('div');
		const left = dom.makeElement<HTMLSpanElement>('span', 'left');
		const title = dom.makeElement<HTMLSpanElement>('span', 'title', name);
		const right = dom.makeElement<HTMLSpanElement>('span', 'right');

		inner.appendChild(left);
		inner.appendChild(title);
		inner.appendChild(right);
		outer.appendChild(inner);

		outer.setAttribute('children', String(this.childLen));
		if (this.childLen) {
			icon = new IconDrawer('md-18');
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
