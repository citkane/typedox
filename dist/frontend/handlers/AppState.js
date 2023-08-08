var _a;
import ErrorHandlers from "./ErrorHandlers.js";
/**
 *
 */
class AppState {
    constructor() {
        this.toggleDisplayOption = (flag) => {
            const displayState = this.options.display[flag];
            const newDisplayState = displayState === "show" ? "hide" : "show";
            this.state.options.display[flag] = newDisplayState;
            return newDisplayState;
        };
        this.setScrollTop = (id, position) => (this.state.scrollTop[id] = position);
        this.getPageData = (fileName) => this.state.pageData[fileName]
            ? Promise.resolve(this.state.pageData[fileName])
            : AppState.fetchDataFromFile(fileName).then((data) => {
                this.state.pageData[fileName] = AppState.deepFreeze(data);
                return this.state.pageData[fileName];
            });
        this.getBreadcrumb = (id, crumbArray = []) => {
            crumbArray.unshift(id);
            const link = this.reflectionMap[id];
            if (!link)
                return undefined;
            if (link.parentId)
                return this.getBreadcrumb(link.parentId, crumbArray);
            return crumbArray;
        };
        this.flushStateCache = () => {
            localStorage.clear();
            this.initCache().then(() => AppState.saveToLocalStorage(this.state));
        };
        window.addEventListener("beforeunload", () => AppState.saveToLocalStorage(this.state));
        window.yaf = { flushStateCache: this.flushStateCache };
    }
    async initCache() {
        const { deepFreeze } = AppState;
        const Promises = [
            AppState.fetchDataFromFile("yafReflectionMap"),
            AppState.fetchDataFromFile("yafReflectionKind"),
            AppState.fetchDataFromFile("yafKindSymbols"),
            AppState.fetchDataFromFile("yafNavigationMenu"),
            AppState.fetchDataFromFile("yafNeedsParenthesis"),
        ];
        try {
            const [reflectionMap, relectionKind, kindSymbols, navigationMenu, needsParenthesis,] = await Promise.all(Promises);
            this.state = {
                pageData: {},
                reflectionMap: deepFreeze(reflectionMap),
                reflectionKind: deepFreeze(relectionKind),
                kindSymbols: deepFreeze(kindSymbols),
                needsParenthesis: deepFreeze(needsParenthesis),
                navigationMenu: deepFreeze(navigationMenu),
                drawers: AppState.getLocalStorageItem("drawers") || {},
                scrollTop: AppState.getLocalStorageItem("scrollTop") || {},
                options: {
                    display: AppState.getLocalStorageItem("displayOptions") ||
                        AppState.defaultOptions.display,
                },
            };
            Object.freeze(this.state);
        }
        catch (err) {
            ErrorHandlers.data(err);
        }
    }
    get reflectionMap() {
        return this.state.reflectionMap;
    }
    get reflectionKind() {
        return this.state.reflectionKind;
    }
    get kindSymbols() {
        return this.state.kindSymbols;
    }
    get needsParenthesis() {
        return this.state.needsParenthesis;
    }
    get navigationMenu() {
        return this.state.navigationMenu;
    }
    get options() {
        return this.state.options;
    }
    get openDrawers() {
        return this.state.drawers;
    }
    get scrollTops() {
        return this.state.scrollTop;
    }
    set openDrawer(id) {
        this.state.drawers[id] = "open";
    }
    set closeDrawer(id) {
        delete this.state.drawers[id];
    }
    get callTypes() {
        return [
            this.reflectionKind.CallSignature,
            this.reflectionKind.ConstructorSignature,
            this.reflectionKind.Function,
            this.reflectionKind.FunctionOrMethod,
            this.reflectionKind.GetSignature,
            this.reflectionKind.Method,
            this.reflectionKind.SetSignature,
        ];
    }
    get projectName() {
        var _b;
        return (_b = this.reflectionMap["project"]) === null || _b === void 0 ? void 0 : _b.name;
    }
}
_a = AppState;
AppState.defaultDataDir = "./data/";
AppState.defaultOptions = {
    display: {
        inherited: "hide",
        private: "hide",
    },
};
AppState.fetchDataFromFile = async (fileName) => {
    fileName = fileName.replace(/.JSON$/i, ".json");
    fileName = fileName.endsWith(".json") ? fileName : `${fileName}.json`;
    const filePath = `${AppState.defaultDataDir}${fileName}`;
    const data = await AppState.fetchFile(filePath, "json");
    return data;
};
AppState.fetchFile = (filePath, type) => new Promise((resolve, reject) => {
    return fetch(filePath).then((stream) => {
        if (stream.ok) {
            resolve(stream[type]());
        }
        else {
            reject(new Error(`${stream.statusText}: ${filePath}`));
        }
    });
});
AppState.getLocalStorageItem = (key) => {
    try {
        const stringData = localStorage.getItem(key);
        const data = stringData ? JSON.parse(stringData) : undefined;
        return data;
    }
    catch (err) {
        ErrorHandlers.localStorage(key);
    }
};
AppState.saveToLocalStorage = (state) => {
    localStorage.setItem("drawers", JSON.stringify(state.drawers));
    localStorage.setItem("scrollTop", JSON.stringify(state.scrollTop));
    localStorage.setItem("displayOptions", JSON.stringify(state.options.display));
};
AppState.deepFreeze = (property) => {
    if (!property || typeof property !== "object")
        return property;
    if (!Object.isFrozen(property))
        Object.freeze(property);
    if (Array.isArray(property)) {
        property.forEach((child) => _a.deepFreeze(child));
    }
    else {
        Object.values(property).forEach((child) => _a.deepFreeze(child));
    }
    return property;
};
export { AppState };
const appState = new AppState();
export default appState;
//# sourceMappingURL=AppState.js.map