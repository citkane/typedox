export declare const makeElement: <T = HTMLElement>(tagName: string, className?: string | null, innerText?: string | null) => T;
export declare const toHTML: (htmlString: string) => HTMLElement;
export declare function appendChildren(this: HTMLElement, children: HTMLElement[]): void;
