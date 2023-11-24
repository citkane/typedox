import { appendChildren, makeElement } from '../lib/dom.js';
import { ChromeFooter, ChromeMain, ChromeLeft } from './_index.js';
export default class DoxApp extends HTMLElement {
    constructor() {
        super();
        this.wrapper = makeElement('div');
        this.doxFooter = new ChromeFooter(); //makeElement<DoxFooter>('dox-footer');
        this.doxNavLeft = new ChromeLeft(); //makeElement<DoxNavLeft>('dox-nav-left');
        this.doxMain = new ChromeMain(); //makeElement<DoxMain>('dox-main');
    }
    connectedCallback() {
        appendChildren.call(this, [this.wrapper, this.doxFooter]);
        appendChildren.call(this.wrapper, [this.doxNavLeft, this.doxMain]);
    }
}
const doxApp = 'dox-app';
customElements.define(doxApp, DoxApp);
//# sourceMappingURL=DoxApp.js.map