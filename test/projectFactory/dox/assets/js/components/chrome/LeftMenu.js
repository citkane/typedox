import { PackageMenu, SettingsMenu, dom, widgets } from '../../index.js';
export class LeftMenu extends HTMLElement {
    constructor() {
        super();
        const packageMenu = new PackageMenu();
        const settingsMenu = new SettingsMenu();
        this.inner = dom.makeElement('div', 'resizeable');
        this.disconnectResizeable = LeftMenu.makeResizeable(this.inner);
        dom.appendChildren.call(this.inner, [packageMenu, settingsMenu]);
    }
    connectedCallback() {
        this.appendChild(this.inner);
    }
    disconnectedCallback() {
        this.disconnectResizeable();
    }
    static makeResizeable(target) {
        const id = 'leftMenu';
        return widgets.makeResizeable(target, 'X', id, () => 120, () => (document.body.clientWidth / 4) * 3);
    }
}
customElements.define('left-menu', LeftMenu);
//# sourceMappingURL=LeftMenu.js.map