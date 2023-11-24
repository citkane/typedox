import { menuBranch, menuMeta } from '@typedox/serialiser';
import { Menu, WidgetDrawer } from '../../index.js';
export declare class PackageMenu extends Menu {
    menu: Promise<PackageDrawer[]>;
    constructor();
    connectedCallback(): Promise<void>;
    disconnectedCallback(): void;
}
declare class PackageDrawer extends WidgetDrawer<menuMeta> {
    constructor(name: string, Class: typeof WidgetDrawer<menuMeta>, meta: menuMeta, depth: number, children?: menuBranch[]);
    connectedCallback(): void;
    disconnectedCallback(): void;
}
export {};
