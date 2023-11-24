export declare class LeftMenu extends HTMLElement {
    private disconnectResizeable;
    inner: HTMLElement;
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    static makeResizeable(target: HTMLElement): () => void;
}
