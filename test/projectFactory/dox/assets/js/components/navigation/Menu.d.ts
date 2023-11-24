import { router } from '../../index.js';
export declare class Menu extends HTMLElement {
    protected context: router.context;
    constructor(context: router.context);
    connectedCallback(): void;
    disconnectedCallback(): void;
    private toggleState;
    private setScrollState;
}
