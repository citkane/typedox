import { DoxFooter, DoxMain, DoxLeft } from './_index.js';
export declare class DoxApp extends HTMLElement {
    wrapper: HTMLDivElement;
    doxFooter: DoxFooter;
    doxNavLeft: DoxLeft;
    doxMain: DoxMain;
    constructor();
    connectedCallback(): void;
}
