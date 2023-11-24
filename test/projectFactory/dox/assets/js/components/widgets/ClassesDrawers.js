import { IconDrawer } from './ClassesIcons.js';
import { dom, state } from '../../index.js';
let id = 0;
export class WidgetDrawer extends HTMLElement {
    constructor(name, Class, meta = {}, depth, children, parent) {
        super();
        this.toggleOpened = (event) => {
            event.stopPropagation();
            const opened = this.classList.contains('open');
            if (event.shiftKey) {
                opened ? this.closeAllChildren() : this.openAllChildren();
            }
            else {
                opened ? this.close() : this.open();
            }
        };
        this.makeDrawerHeader = (name) => {
            let icon;
            const outer = dom.makeElement('div', 'header');
            const inner = dom.makeElement('div');
            const left = dom.makeElement('span', 'left');
            const title = dom.makeElement('span', 'title', name);
            const right = dom.makeElement('span', 'right');
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
        this.makeChildDrawers = (children) => {
            const accumulator = [];
            if (!children)
                return accumulator;
            return children.reduce((accumulator, childBranch) => {
                const childDrawer = this.makeChildDrawer(childBranch.name, childBranch.children, childBranch.meta);
                accumulator.push(childDrawer);
                return accumulator;
            }, accumulator);
        };
        this.makeChildDrawer = (name, children, meta) => {
            const drawer = new this.Class(name, this.Class, meta, this.depth + 1, children);
            return drawer;
        };
        this.did = id;
        id++;
        this.depth = depth;
        this.name = name;
        this.parent = parent;
        this.Class = Class;
        this.meta = meta;
        this.childLen = (children === null || children === void 0 ? void 0 : children.length) || 0;
        this.header = this.makeDrawerHeader(name);
        this.drawers = dom.makeElement('div', 'drawers');
        this.childDrawers = this.makeChildDrawers(children);
        dom.appendChildren.call(this.drawers, this.childDrawers);
        if (!this.childLen)
            return;
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
    open() {
        var _a;
        this.classList.remove('closed');
        this.classList.add('open');
        (_a = this.header.icon) === null || _a === void 0 ? void 0 : _a.setAttribute('state', 'open');
        state.menuDrawer = [this.did, true];
    }
    close() {
        var _a;
        this.classList.remove('open');
        this.classList.add('closed');
        (_a = this.header.icon) === null || _a === void 0 ? void 0 : _a.setAttribute('state', 'closed');
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
}
customElements.define('widget-drawer', WidgetDrawer);
//# sourceMappingURL=ClassesDrawers.js.map