import { menuBranch } from '@typedox/serialiser';
import { IconDrawer } from './libIcons.js';
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
const drawerCache = new Map<number, WidgetDrawer<any>>();

export class WidgetDrawer<T> extends HTMLElement {
	public depth: number;
	public name: string;
	public parent: WidgetDrawer<T> | undefined;
	public header: header;
	public Class: typeof WidgetDrawer<T>;
	public meta: T;
	public drawers?: HTMLDivElement;

	private childLen: number;
	private childBranches?: menuBranch[];
	private childIds = new Map<number, number>();
	private did: number;
	private placeholderTimeouts = new Set<ReturnType<typeof setTimeout>>();

	constructor(
		name: string,
		Class: typeof WidgetDrawer<T>,
		meta = {} as T,
		depth: number,
		index: number,
		children?: menuBranch[],
		parent?: WidgetDrawer<T>,
	) {
		super();

		this.did = id;
		parent && parent.childIds.set(index, id);
		drawerCache.set(id, this);
		id++;

		this.depth = depth;
		this.name = name;
		this.parent = parent;
		this.Class = Class;
		this.meta = meta;
		this.childBranches = children;
		this.childLen = children?.length || 0;

		this.header = this.makeDrawerHeader(name);
		if (!this.childLen) return;

		this.drawers = dom.makeElement('div', 'drawers');
	}
	connectedCallback() {
		this.classList.add('drawer', 'doxdrawer');
		if (!this.childElementCount) {
			this.appendChild(this.header.outer);
			if (this.drawers) this.appendChild(this.drawers);
		}

		state.menuDrawers(this.did) ? this.open() : this.close();
		this.header.left.addEventListener('click', this.toggleOpened);
	}
	disconnectedCallback() {
		this.header.left.removeEventListener('click', this.toggleOpened);
	}
	toggleOpened = (event: MouseEvent) => {
		event.stopPropagation();
		const opened = this.classList.contains('open');
		opened ? this.close() : this.open();
	};
	private open() {
		if (!this.drawers) return;

		this.classList.remove('closed');
		this.classList.add('open');
		this.header.icon?.setAttribute('state', 'open');
		state.menuDrawer = [this.did, true];

		const drawers = this.makeChildDrawers();
		drawers?.forEach((drawer) => this.drawers?.appendChild(drawer));
	}
	private close() {
		if (!this.drawers) return;

		this.placeholderTimeouts.forEach((timeout) => clearTimeout(timeout));
		this.placeholderTimeouts.clear();
		this.drawers.replaceChildren();
		this.classList.remove('open');
		this.classList.add('closed');
		this.header.icon?.setAttribute('state', 'closed');
		state.menuDrawer = [this.did, false];
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

		//outer.setAttribute('children', String(this.childLen));
		if (this.childLen) {
			icon = new IconDrawer('md-18');
			left.appendChild(icon);
			left.style.cursor = 'pointer';
		}

		return { outer, inner, left, title, right, icon };
	};
	private makeChildDrawers = () => {
		const accumulator = [] as HTMLElement[];

		return this.childBranches?.reduce((accumulator, childBranch, i) => {
			((child) => accumulate.call(this, childBranch, i, child))(
				getChild(childId.call(this, i)),
			);
			if (isLastChild.call(this, i)) setTimeout(() => this.insertBatch());

			return accumulator;
		}, accumulator);

		function isLastChild(this: WidgetDrawer<T>, i: number) {
			return i === this.childBranches!.length - 1;
		}
		function accumulate(
			this: WidgetDrawer<T>,
			childBranch: menuBranch,
			i: number,
			child?: WidgetDrawer<any>,
		) {
			!!child
				? accumulator.push(child)
				: this.makeChildDrawer(childBranch, i);
		}
		function childId(this: WidgetDrawer<T>, i: number) {
			return !!this.childIds.has(i) ? this.childIds.get(i) : undefined;
		}
		function getChild(childId?: number) {
			if (!childId) return undefined;
			return drawerCache.has(childId)
				? drawerCache.get(childId)
				: undefined;
		}
	};
	private chunkSize = 0;
	private placeholder = new Set<[number, HTMLElement]>();
	private makeChildDrawer(childBranch: menuBranch, index: number) {
		const { name, children, meta } = childBranch;
		const timeout = setTimeout(() => {
			const child = new this.Class(
				name,
				this.Class,
				meta as T,
				this.depth + 1,
				index,
				children,
				this,
			);
			this.chunkSize++;
			this.placeholder.add([index, child]);
			if (this.chunkSize >= 1000) this.insertBatch();
			this.placeholderTimeouts.delete(timeout);
		});
		this.placeholderTimeouts.add(timeout);
	}
	private insertBatch(this: WidgetDrawer<any>) {
		this.placeholder.forEach(
			([index, child]) =>
				this.drawers?.insertBefore(
					child,
					this.drawers.childNodes[index + 1],
				),
		);
		this.placeholder.clear();
		this.chunkSize = 0;
	}
}

customElements.define('widget-drawer', WidgetDrawer);
