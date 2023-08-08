/**
 * `typedoc-theme-yaf` Is a data driven single page application (SPA).\
 * You are hopefully looking at it right now.
 *
 * This frontend is a zero dependency construct of native [Web Components](https://en.wikipedia.org/wiki/Web_Components),
 * all being ancestors of {@link frontend.webComponents.TypedocThemeYaf}.
 *
 * Much of the frontend architecture is {@link frontend.handlers.Events event driven}.
 *
 * The {@link frontend.handlers.AppState application state} is generally immutable, and persisted across sessions using `localstorage`.
 *
 * @author Michael Jonker
 * @module frontend
 */
export { default as YafHTMLElement } from "./YafHTMLElement.js";
export { Events } from "./handlers/events/Events.js";
export * from "./YafElementDrawers.js";
export * as yafElement from "./yafElement.js";
export * as handlers from "./handlers/index.js";
export * as webComponents from "./webComponents/index.js";
