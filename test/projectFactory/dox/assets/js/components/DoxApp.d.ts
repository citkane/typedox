import { ChromeFooter, ChromeMain, ChromeLeft } from './_index.js';
export default class DoxApp extends HTMLElement {
    wrapper: HTMLDivElement;
    doxFooter: ChromeFooter;
    doxNavLeft: ChromeLeft;
    doxMain: ChromeMain;
    constructor();
    connectedCallback(): void;
}
