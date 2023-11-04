import { DoxLeftContext } from './DoxLeftContext.js';
import { DoxLeftMenu } from './DoxLeftMenu.js';
export declare class DoxLeft extends HTMLElement {
    doxLeftContext: DoxLeftContext;
    doxLeftMenu: DoxLeftMenu;
    private minMenuX;
    constructor();
    connectedCallback(): void;
    private makeDragTrigger;
}
