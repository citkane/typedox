import { menuBranch, menuMeta } from '@typedox/serialiser';
import {
	Menu,
	WidgetDrawer,
	declaration,
	dom,
	events,
	files,
	state,
} from '../../index.js';
import { CategoryKind, SyntaxKind } from '../../factories/factoryEnums.js';
import { NavLink } from './NavLinks.js';

export class PackageMenu extends Menu {
	menu: Promise<PackageDrawer[]>;
	constructor() {
		super('packages');

		this.menu = files
			.fetchDataFromFile<menuBranch[]>('assets/_packageMenu.json')
			.then((menudata) =>
				menudata.map(
					(data, i) =>
						new PackageDrawer(
							data.name,
							PackageDrawer,
							data.meta as menuMeta,
							0,
							i,
							data.children,
						),
				),
			);

		events.on('context.declarations.change', (context) => {
			!!state.declarationContexts[context]
				? this.classList.add(context)
				: this.classList.remove(context);
		});
	}
	connectedCallback() {
		super.connectedCallback(
			this.menu
				.then((menuDrawers) => {
					dom.appendChildren.call(this, menuDrawers);
					this.scrollTop = state.menuScrollTop;
				})
				.catch((err) =>
					console.error('Trouble getting the package menu:', err),
				),
		);
	}
	disconnectedCallback() {
		super.disconnectedCallback();
	}
}

class PackageDrawer extends WidgetDrawer<menuMeta> {
	private kind = declaration.syntaxKind(this.meta);
	private isExternal = declaration.isExternal(this.meta);
	private isLocal = declaration.isLocal(this.meta, this.kind);
	private isImported = declaration.isImported(this.meta, this.kind);
	private isReexported = declaration.isReexported(this.meta, this.kind);

	constructor(
		name: string,
		Class: typeof WidgetDrawer<menuMeta>,
		meta: menuMeta,
		depth: number,
		index: number,
		children?: menuBranch[],
		parent?: PackageDrawer,
	) {
		super(name, Class, meta, depth, index, children, parent);

		this.meta = meta;
		this.header.right.style.paddingRight = '5px';
		((paddingLeft) =>
			(this.header.left.style.paddingLeft = `${paddingLeft}px`))(
			depth * 12,
		);
		((category) => this.header.right.appendChild(category))(
			PackageDrawer.categoryDiv(this.meta),
		);
	}
	connectedCallback() {
		super.connectedCallback();

		if (this.kind) this.classList.add(SyntaxKind[this.kind]);
		if (this.isLocal) this.classList.add('local');
		if (this.isExternal) this.classList.add('external');
		if (this.isImported) this.classList.add('imported');
		if (this.isReexported) this.classList.add('reexported');

		if (!this.meta.location) {
			this.header.title.onclick = this.toggleOpened;
			this.header.title.style.cursor = 'pointer';
		} else {
			this.header.title.replaceChildren(
				new NavLink(this.name, this.meta.location),
			);
		}
	}
	disconnectedCallback() {
		super.disconnectedCallback();
	}

	static categoryDiv(meta: menuMeta) {
		return dom.makeElement(
			'div',
			`widget category ${CategoryKind[meta.category]}`,
		);
	}
}

customElements.define('package-drawer', PackageDrawer);
customElements.define('package-menu', PackageMenu);
