import { menuBranch } from '@typedox/serialiser';
export declare class DoxWidgetDrawer extends HTMLElement {
    depth: number;
    name: string;
    parent: DoxWidgetDrawer | undefined;
    header: HTMLDivElement;
    childDrawers: DoxWidgetDrawer[];
    private drawers;
    private inset;
    constructor(name: string, category: keyof typeof document.dox.categoryKind, children?: menuBranch[], depth?: number, parent?: DoxWidgetDrawer);
    connectedCallback(): void;
    disconnectedCallback(): void;
    toggleOpened: (event: MouseEvent) => void;
    open(): void;
    close(): void;
    closeAllChildren(): void;
    openAllChildren(): void;
}
