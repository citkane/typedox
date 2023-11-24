import { DoxLocation } from '@typedox/core';
import { router } from '../index.js';
interface resize {
    X: number;
    Y: number;
}
export declare let state: State;
export declare class State {
    private _location;
    private _menuDrawers;
    private _menuContext;
    private _menuScrollTop;
    private _declarationSrollTop;
    private _resizes;
    constructor();
    init(): void;
    flush(): void;
    set location(location: DoxLocation);
    get location(): DoxLocation;
    set menuDrawer(state: [id: number, open: boolean]);
    menuDrawers: (id: number) => boolean;
    set menuContext(context: router.context);
    get menuContext(): router.context;
    set menuScrollTop(top: number);
    get menuScrollTop(): number;
    set declarationScrollTop(scrollTop: number);
    get declarationScrollTop(): number;
    set resize(state: [id: string, size: resize]);
    resizes(id: string): resize;
    saved: boolean;
    private saveState;
    private restoreState;
}
export {};
