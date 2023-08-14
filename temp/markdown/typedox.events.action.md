<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [typedox](./typedox.md) &gt; [Events](./typedox.events.md) &gt; [action](./typedox.events.action.md)

## Events.action property

**Signature:**

```typescript
action: {
	content: {
		setLocation: () => Event;
		scrollTo: (target: string | number) => CustomEvent<actions.scrollTo>;
		scrollTop: (scrollTop: number) =>
			CustomEvent<actions.content.scrollTop>;
		getPageId: (callBack: (pageId: number) => void) =>
			CustomEvent<actions.content.getPageId>;
		breadcrumb: (id: number) => CustomEvent<actions.content.breadcrumb>;
	}
	menu: {
		rollMenuDown: () => Event;
		rollMenuUp: () => Event;
		scrollTo: (target: string | number) => CustomEvent<actions.scrollTo>;
		toggle: (state?: 'open' | 'close' | undefined) =>
			CustomEvent<actions.menu.toggle>;
		search: (searchString: string) => CustomEvent<actions.menu.search>;
	}
	drawers: {
		resetHeight: () => Event;
	}
	options: {
		display: (key: 'inherited' | 'private', value: 'show' | 'hide') =>
			CustomEvent<{
				key: 'inherited' | 'private';
				value: 'show' | 'hide';
			}>;
	}
}
```