import { DoxLocation } from '@typedox/core';
import { IconContext, router } from '../../index.js';
export declare class NavLink extends HTMLElement {
    link: HTMLAnchorElement;
    location: DoxLocation;
    constructor(text: string, location: DoxLocation);
    connectedCallback(): void;
    disconnectedCallback(): void;
    route: (event: MouseEvent) => void;
}
export declare class NavContext extends HTMLElement {
    private icon;
    private context;
    constructor(context: router.context, icon: IconContext);
    connectedCallback(): void;
    disconnectedCallback(): void;
    setState: (event?: MouseEvent) => void;
    toggleState: (context: "code" | "settings" | "packages" | "documents") => void;
}
