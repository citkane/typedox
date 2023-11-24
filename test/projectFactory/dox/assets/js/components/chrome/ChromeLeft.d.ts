import { LeftContext } from './LeftContext.js';
import { LeftMenu } from './LeftMenu.js';
export declare class ChromeLeft extends HTMLElement {
    doxLeftContext: LeftContext;
    doxLeftMenu: LeftMenu;
    constructor();
    connectedCallback(): void;
}
