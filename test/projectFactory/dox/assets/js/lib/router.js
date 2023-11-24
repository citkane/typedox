import { events } from '../index.js';
export const contexts = {
    settings: {},
    packages: {},
    documents: {},
    code: {},
};
export function route(location) {
    const url = locationToUrl(location);
    history.pushState(location, '', url);
    events.emit('nav.history.pushState', location);
}
export function locationToUrl(location) {
    const { origin, pathname } = window.location;
    const url = origin + pathname;
    const uri = location.hash
        ? `${encodeURIComponent(location.query)}#${encodeURIComponent(location.hash)}`
        : encodeURIComponent(location.query);
    return `${url}?dox=${uri}`;
}
export function urlToLocation(url) {
    const params = new URLSearchParams(url.search);
    const query = params.get('dox');
    if (!query)
        return undefined;
    const hash = url.hash;
    return {
        query: decodeURIComponent(query),
        hash: hash ? decodeURIComponent(hash) : undefined,
    };
}
//# sourceMappingURL=router.js.map