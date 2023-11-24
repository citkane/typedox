var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Menu, WidgetDrawer, dom, files } from '../../index.js';
import { CategoryKind } from '../../factories/factoryEnums.js';
import { NavLink } from './NavLinks.js';
export class PackageMenu extends Menu {
    constructor() {
        super('packages');
        this.menu = files
            .fetchDataFromFile('assets/_packageMenu.json')
            .then((menudata) => {
            return menudata.map((data) => {
                const { name, children, meta } = data;
                return new PackageDrawer(name, PackageDrawer, meta, 0, children);
            });
        });
    }
    connectedCallback() {
        const _super = Object.create(null, {
            connectedCallback: { get: () => super.connectedCallback }
        });
        return __awaiter(this, void 0, void 0, function* () {
            _super.connectedCallback.call(this);
            this.menu
                .then((menuDrawers) => {
                dom.appendChildren.call(this, menuDrawers);
            })
                .catch((err) => console.error('Trouble getting the package menu:', err));
        });
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
}
class PackageDrawer extends WidgetDrawer {
    constructor(name, Class, meta, depth, children) {
        super(name, Class, meta, depth, children);
        const paddingLeft = depth * 12;
        this.header.left.style.paddingLeft = `${paddingLeft}px`;
        const category = dom.makeElement('div', `widget category ${CategoryKind[this.meta.category]}`);
        this.header.right.appendChild(category);
        this.header.right.style.paddingRight = '5px';
    }
    connectedCallback() {
        super.connectedCallback();
        if (!this.meta.location) {
            this.header.title.addEventListener('click', this.toggleOpened);
            this.header.title.style.cursor = 'pointer';
        }
        else {
            this.header.title.replaceChildren(new NavLink(this.name, this.meta.location));
        }
    }
    disconnectedCallback() {
        super.disconnectedCallback();
        this.header.title.removeEventListener('click', this.toggleOpened);
    }
}
customElements.define('package-drawer', PackageDrawer);
customElements.define('package-menu', PackageMenu);
//# sourceMappingURL=PackageMenu.js.map