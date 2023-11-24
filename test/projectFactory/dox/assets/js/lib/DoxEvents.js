export class DoxEvents {
    constructor(...args) {
        this.once = (event, callback) => {
            const trigger = makeTrigger(callback);
            function onceTrigger(event) {
                document.body.removeEventListener(String(event), trigger);
                trigger(event);
            }
            document.body.addEventListener(String(event), onceTrigger);
        };
        this.on = (event, callback) => {
            if (!registry[event]) {
                registry[event] = new Map();
            }
            const register = registry[event];
            const trigger = makeTrigger(callback);
            register.set(callback, trigger);
            document.body.addEventListener(String(event), trigger);
        };
        this.off = (event, callback) => {
            if (!registry[event] ||
                !registry[event].has(callback)) {
                return;
            }
            const trigger = registry[event].get(callback);
            document.body.removeEventListener(String(event), trigger);
        };
        this.emit = (event, ...argsArray) => {
            const customEvent = argsArray
                ? new CustomEvent(String(event), {
                    detail: argsArray,
                })
                : new Event(String(event));
            document.body.dispatchEvent(customEvent);
        };
        this.api = args.reduce((accummulator, api) => {
            accummulator = Object.assign(Object.assign({}, accummulator), api);
            return accummulator;
        }, {});
    }
}
const registry = {};
const makeTrigger = (callback) => {
    return (event) => {
        const args = isCustomEvent(event) ? event.detail : undefined;
        args ? callback(...args) : callback();
    };
    function isCustomEvent(event) {
        return 'detail' in event;
    }
};
//# sourceMappingURL=DoxEvents.js.map