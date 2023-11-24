import { menuBranch } from '@typedox/serialiser';
import { IconDrawer } from './ClassesIcons.js';
interface header {
    outer: HTMLDivElement;
    inner: HTMLDivElement;
    left: HTMLSpanElement;
    title: HTMLSpanElement;
    right: HTMLSpanElement;
    icon?: IconDrawer;
}
export declare class WidgetDrawer<T> extends HTMLElement {
    depth: number;
    name: string;
    parent: WidgetDrawer<T> | undefined;
    header: header;
    childDrawers: WidgetDrawer<T>[];
    Class: typeof WidgetDrawer<T>;
    meta: T;
    protected drawers: HTMLDivElement;
    protected childLen: number;
    private did;
    constructor(name: string, Class: typeof WidgetDrawer<T>, meta: T | undefined, depth: number, children?: menuBranch[], parent?: WidgetDrawer<T>);
    connectedCallback(): void;
    disconnectedCallback(): void;
    toggleOpened: (event: MouseEvent) => void;
    open(): void;
    close(): void;
    closeAllChildren(): void;
    openAllChildren(): void;
    protected makeDrawerHeader: (name: string) => header;
    protected makeChildDrawers: (children: menuBranch[] | undefined) => WidgetDrawer<T>[];
    protected makeChildDrawer: (name: string, children: menuBranch[] | undefined, meta: T) => WidgetDrawer<T>;
}
export {};
