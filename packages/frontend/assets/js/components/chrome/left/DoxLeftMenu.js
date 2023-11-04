import { DoxWidgetDrawer } from '../../widgets/_index.js';
export class DoxLeftMenu extends HTMLElement {
    connectedCallback() {
        const { mainMenu } = document.dox;
        indexMenu(mainMenu);
        sortMenu(mainMenu);
        this.buildMenu(mainMenu);
    }
    buildMenu(menu) {
        const { name, children, category } = menu;
        const drawer = new DoxWidgetDrawer(name, category, children);
        this.appendChild(drawer);
    }
}
const doxLeftMenu = 'dox-left-menu';
customElements.define(doxLeftMenu, DoxLeftMenu);
function sortMenu(menu) {
    var _a, _b;
    (_a = menu.children) === null || _a === void 0 ? void 0 : _a.sort((a, b) => {
        const aIndex = a.category + a.name;
        const bIndex = b.category + b.name;
        if (aIndex === bIndex)
            return 0;
        return aIndex > bIndex ? 1 : -1;
    });
    (_b = menu.children) === null || _b === void 0 ? void 0 : _b.forEach((child) => sortMenu(child));
}
function indexMenu(menu) {
    var _a;
    const { index, name, category } = menu;
    const prefix = menu.index ? `${menu.index}.` : '';
    menu.index = `${prefix}${menu.name}`;
    (_a = menu.children) === null || _a === void 0 ? void 0 : _a.forEach((child) => {
        child.index = menu.index;
        indexMenu(child);
    });
}
//# sourceMappingURL=DoxLeftMenu.js.map