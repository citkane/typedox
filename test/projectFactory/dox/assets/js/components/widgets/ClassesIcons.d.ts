export declare const symbolFont = "material-symbols-outlined";
export type icon = keyof typeof symbols;
declare const symbols: {
    down: string;
    package: string;
    document: string;
    settings: string;
    fullscreen: string;
    exitFullscreen: string;
    code: string;
};
type symbolSize = 'md-18' | 'md-24' | 'md-36' | 'md-48';
declare class Icon extends HTMLElement {
    protected symbolSize: symbolSize;
    constructor(symbolSize: symbolSize);
    setSymbol(symbol: keyof typeof symbols): void;
}
export declare class IconDrawer extends Icon {
    static observedAttributes: string[];
    constructor(symbolSize: symbolSize);
    connectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string, newValue: string): void;
    close: () => void;
    open: () => void;
}
export declare class IconContext extends Icon {
    symbol: icon;
    constructor(symbolSize: symbolSize, symbol: icon);
    connectedCallback(): void;
}
export declare class IconFullscreen extends Icon {
    static observedAttributes: string[];
    constructor(symbolSize: symbolSize);
    connectedCallback(): void;
    attributeChangedCallback(name: string, oldValue: string, newValue: string): void;
    opened(): void;
    closed(): void;
}
export {};
