import { JSONOutput } from 'typedoc';
import { ReflectionKind as ReflectionKind_2 } from 'typedoc';

declare namespace actions {
	{
		content, menu, drawers, options, scrollTo_2 as scrollTo;
	}
}

declare type displayStates = 'show' | 'hide';

export declare type DrawerElement = HTMLElement & YafElementDrawers;

declare type drawerState = 'open' | 'closed';

export declare class Events {
	trigger: {
		content: {
			setLocation: string;
			scrollTo: string;
			scrollTop: string;
			getPageId: string;
			breadcrumb: string;
		};
		menu: {
			rollMenuDown: string;
			rollMenuUp: string;
			scrollTo: string;
			toggle: string;
			search: string;
		};
		drawers: {
			resetHeight: string;
		};
		options: {
			display: string;
		};
	};
	action: {
		content: {
			setLocation: () => Event;
			scrollTo: (
				target: string | number,
			) => CustomEvent<actions.scrollTo>;
			scrollTop: (
				scrollTop: number,
			) => CustomEvent<actions.content.scrollTop>;
			getPageId: (
				callBack: (pageId: number) => void,
			) => CustomEvent<actions.content.getPageId>;
			breadcrumb: (id: number) => CustomEvent<actions.content.breadcrumb>;
		};
		menu: {
			rollMenuDown: () => Event;
			rollMenuUp: () => Event;
			scrollTo: (
				target: string | number,
			) => CustomEvent<actions.scrollTo>;
			toggle: (
				state?: 'open' | 'close' | undefined,
			) => CustomEvent<actions.menu.toggle>;
			search: (searchString: string) => CustomEvent<actions.menu.search>;
		};
		drawers: {
			resetHeight: () => Event;
		};
		options: {
			display: (
				key: 'inherited' | 'private',
				value: 'show' | 'hide',
			) => CustomEvent<{
				key: 'inherited' | 'private';
				value: 'show' | 'hide';
			}>;
		};
	};
	dispatch: (action: CustomEvent | Event, element?: HTMLElement) => boolean;
	on: (
		trigger: string,
		callBack: unknown,
		element?: HTMLElement | Window,
	) => void;
	off: (
		trigger: string,
		callBack: unknown,
		element?: HTMLElement | Window,
	) => void;
	private static body;
}

declare type flagCounts = Record<keyof yafState['options']['display'], number>;

declare interface kindSymbol {
	className: string;
	symbol: string;
}

declare type kindSymbols = {
	[key: number]: kindSymbol;
};

declare type needsParenthesis = Record<string, Record<string, boolean>>;

declare type ReflectionKind = typeof ReflectionKind_2;

declare type reflectionMap = {
	[key: string]: YAFReflectionLink;
};

declare type treeMenuBranch = {
	children: treeMenuRoot;
	target?: string;
	parent?: string;
};

declare type treeMenuRoot = {
	[key: string]: treeMenuBranch;
};

/**
 * Utility class for folding, hierarchical drawers
 */
export declare class YafElementDrawers {
	drawer: HTMLElement;
	drawerParent: DrawerElement;
	drawerTrigger: HTMLElement;
	drawerId: string;
	parentDrawerElement?: DrawerElement;
	debounceResize: ReturnType<typeof setTimeout> | null;
	isDrawer: boolean;
	hasContent: boolean;
	drawers: YafElementDrawers;
	childDrawers: DrawerElement[];
	constructor(
		drawerParent: DrawerElement,
		drawer: HTMLElement,
		drawerTrigger: HTMLElement,
		id: string,
		parentDrawerElement?: DrawerElement,
	);
	drawerHasDisconnected: () => void;
	private eventsList;
	renderDrawers: (init?: boolean) => void;
	openDrawer: () => void;
	closeDrawer: () => void;
	toggleDrawerState: () => void;
	heightControl: {
		initDataHeight: (clientHeight: number) => void;
		setMaxHeightStyle: () => void;
		updateHeightAbove: (height: number) => void;
		reRenderDrawers: (init?: boolean) => void;
		resetHeights: (init?: boolean) => void;
		debounceReset: () => void;
	};
	get dataHeight(): number;
	set dataHeight(height: number);
	get dataExtraHeight(): number;
	set dataExtraHeight(height: number);
	set dataExtraReset(height: number);
	get maxHeightPixels(): string;
	get drawerState(): drawerState;
	get childDrawerElements(): DrawerElement[];
	get isRoot(): boolean;
	get isBranch(): boolean;
	get isLeaf(): boolean;
	get flagCounts(): flagCounts;
	static findParentDrawers: (
		child: HTMLElement,
		parents?: DrawerElement[],
	) => DrawerElement[];
	static hasClosedDrawers: (drawers: DrawerElement[]) => boolean | 0;
}

/**
 * A base class extension for all custom HTML WebComponents.
 *
 * It provides:
 *  - The often used `appendChildren` utility as a convenience to all Yaf components.
 *  - overrides the default `connectedCallback` with the purpose of providing a de-bouncer.\
 *    For inexplicable reasons, some nested custom WebComponents get multiple connected signals.
 */
export declare class YafHTMLElement<
	T = Record<string, never>,
> extends HTMLElement {
	props: T;
	appendChildren: (children: (HTMLElement | undefined)[] | undefined) => void;
	private debounceCount;
	/**
	 * The standard Web Component connect entry.
	 *
	 * This debounces or triggers the new `onConnect` trigger used in all ancestor Yaf theme components.
	 */
	connectedCallback(): void;
}

declare type YAFReflectionLink = {
	id: number;
	parentId?: number;
	name: string;
	query: string;
	hash?: string;
	kind: number;
	target?: number;
	flags?: JSONOutput.ReflectionFlags;
};

declare interface yafState {
	reflectionMap: reflectionMap;
	reflectionKind: ReflectionKind;
	kindSymbols: kindSymbols;
	needsParenthesis: needsParenthesis;
	navigationMenu: treeMenuRoot;
	pageData: {
		[key: string]: unknown;
	};
	drawers: {
		[key: string]: drawerState;
	};
	scrollTop: {
		[key: string]: number;
	};
	options: {
		display: {
			inherited: displayStates;
			private: displayStates;
		};
	};
}

export {};
