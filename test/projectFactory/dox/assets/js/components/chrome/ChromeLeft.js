import { dom } from '../../index.js';
import { LeftContext } from './LeftContext.js';
import { LeftMenu } from './LeftMenu.js';
export class ChromeLeft extends HTMLElement {
    constructor() {
        super();
        this.doxLeftContext = new LeftContext();
        this.doxLeftMenu = new LeftMenu();
    }
    connectedCallback() {
        dom.appendChildren.call(this, [this.doxLeftContext, this.doxLeftMenu]);
    }
}
customElements.define('chrome-left', ChromeLeft);
//# sourceMappingURL=ChromeLeft.js.map