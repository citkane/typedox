import { DoxLocation } from '@typedox/core';
import { events, router } from './index.js';

type drawerState = Record<string, boolean>;
interface resize {
	X: number;
	Y: number;
}
const defaultResize: resize = { X: 360, Y: 50 };

export type declarationContext = {
	local?: true;
	reexported?: true;
	imported?: true;
	external?: true;
};
export let state: State;
export class State {
	private _location: DoxLocation = { query: 'home', hash: '' };
	private _menuDrawers: drawerState = {};
	private _menuContext: router.context = 'packages';
	private _declarationContext = {} as declarationContext;
	private _menuScrollTop = {} as Record<router.context, number>;
	private _declarationSrollTop = {} as Record<string, number>;
	private _resizes: Record<string, resize> = {};

	constructor() {
		state = this;
		this.restoreState();
		document.onvisibilitychange = () => this.saveState();
		window.onbeforeunload = () => this.saveState();
	}

	public init() {
		events.emit('nav.context.switch', this._menuContext);
		Object.keys(this._declarationContext).forEach((key) => {
			const context = key as keyof declarationContext;
			events.emit('context.declarations.change', context);
		});
	}
	public flush() {
		localStorage.clear();
		window.onbeforeunload = () => null;
		document.onvisibilitychange = () => null;
		window.location.reload();
	}

	public set location(location: DoxLocation) {
		this._location = location;
	}
	public get location() {
		return this._location;
	}

	public set menuDrawer(state: [id: number, open: boolean]) {
		state[1]
			? (this._menuDrawers[state[0]] = state[1])
			: delete this._menuDrawers[state[0]];
	}
	public menuDrawers = (id: number) => {
		return this._menuDrawers[id];
	};

	public set menuContext(context: router.context) {
		if (this._menuContext === context) return;
		this._menuContext = context;
		events.emit('nav.context.switch', context);
	}
	public get menuContext() {
		return this._menuContext;
	}

	public set menuScrollTop(top: number) {
		this._menuScrollTop[this.menuContext] = top;
	}
	public get menuScrollTop() {
		return this._menuScrollTop[this.menuContext] || 0;
	}

	public set declarationContext(context: keyof declarationContext) {
		if (this._declarationContext[context]) {
			delete this._declarationContext[context];
		} else {
			this._declarationContext[context] = true;
		}
		events.emit('context.declarations.change', context);
	}

	public get declarationContexts() {
		return this._declarationContext;
	}
	public set declarationScrollTop(scrollTop: number) {
		this._declarationSrollTop[this.location.query] = scrollTop;
	}
	public get declarationScrollTop() {
		return this._declarationSrollTop[this.location.query] || 0;
	}

	public set resize(state: [id: string, size: resize]) {
		this._resizes[state[0]] = state[1];
	}
	public resizes(id: string) {
		return this._resizes[id] || defaultResize;
	}

	saved = false;
	private saveState() {
		if (this.saved) return;
		this.saved = true;

		const storedState = Object.keys(this).reduce(
			(accumulator, k) => {
				this.hasOwnProperty(k);
				if (!this.hasOwnProperty(k) || !k.startsWith('_'))
					return accumulator;
				const key = k as keyof State;
				accumulator[key] = this[key];
				return accumulator;
			},
			{} as Record<string, unknown>,
		);
		const stateString = JSON.stringify(storedState);
		localStorage.setItem('doxState', stateString);
	}
	private restoreState() {
		const doxStoredState = localStorage.getItem('doxState');
		if (!doxStoredState) return;

		const savedState = JSON.parse(doxStoredState);
		Object.keys(savedState).forEach((k) => {
			if (!this.hasOwnProperty(k) || !k.startsWith('_')) return;
			const key = k as keyof typeof this;
			this[key] = savedState[key];
		});
	}
}
