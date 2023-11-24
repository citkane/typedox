import { events } from '../index.js';
const defaultResize = { X: 360, Y: 50 };
export let state;
export class State {
    constructor() {
        this._location = { query: 'home', hash: '' };
        this._menuDrawers = {};
        this._menuContext = 'packages';
        this._menuScrollTop = {};
        this._declarationSrollTop = {};
        this._resizes = {};
        this.menuDrawers = (id) => {
            return this._menuDrawers[id];
        };
        this.saved = false;
        state = this;
        this.restoreState();
        document.onvisibilitychange = () => this.saveState();
        window.onbeforeunload = () => this.saveState();
    }
    init() {
        events.emit('nav.context.switch', this._menuContext);
    }
    flush() {
        localStorage.clear();
        window.onbeforeunload = () => null;
        document.onvisibilitychange = () => null;
        window.location.reload();
    }
    set location(location) {
        this._location = location;
    }
    get location() {
        return this._location;
    }
    set menuDrawer(state) {
        state[1]
            ? (this._menuDrawers[state[0]] = state[1])
            : delete this._menuDrawers[state[0]];
    }
    set menuContext(context) {
        if (this._menuContext === context)
            return;
        this._menuContext = context;
        events.emit('nav.context.switch', context);
    }
    get menuContext() {
        return this._menuContext;
    }
    set menuScrollTop(top) {
        this._menuScrollTop[this.menuContext] = top;
    }
    get menuScrollTop() {
        return this._menuScrollTop[this.menuContext] || 0;
    }
    set declarationScrollTop(scrollTop) {
        this._declarationSrollTop[this.location.query] = scrollTop;
    }
    get declarationScrollTop() {
        return this._declarationSrollTop[this.location.query] || 0;
    }
    set resize(state) {
        this._resizes[state[0]] = state[1];
    }
    resizes(id) {
        return this._resizes[id] || defaultResize;
    }
    saveState() {
        if (this.saved)
            return;
        this.saved = true;
        const storedState = Object.keys(this).reduce((accumulator, k) => {
            this.hasOwnProperty(k);
            if (!this.hasOwnProperty(k) || !k.startsWith('_'))
                return accumulator;
            const key = k;
            accumulator[key] = this[key];
            return accumulator;
        }, {});
        const stateString = JSON.stringify(storedState);
        localStorage.setItem('doxState', stateString);
    }
    restoreState() {
        const doxStoredState = localStorage.getItem('doxState');
        if (!doxStoredState)
            return;
        const savedState = JSON.parse(doxStoredState);
        Object.keys(savedState).forEach((k) => {
            if (!this.hasOwnProperty(k) || !k.startsWith('_'))
                return;
            const key = k;
            this[key] = savedState[key];
        });
    }
}
//# sourceMappingURL=State.js.map