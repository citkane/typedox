"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dox = __importStar(require("../typedox"));
const ts = __importStar(require("typescript"));
class Logger {
    constructor() {
        this.logLevel = 'info';
        this.logLevels = {
            debug: 0,
            info: 1,
            warning: 2,
            error: 3,
        };
        this.debug = (...args) => this.emit('debug')
            ? console.error(Logger.colorise('Bright', '[debug]'), ...args)
            : null;
        this.info = (...args) => this.emit('info') ? console.info('[info]', ...args) : null;
        this.warn = (...args) => this.emit('warning')
            ? console.warn(Logger.colorise('FgYellow', '[warning]'), ...args)
            : null;
        this.error = (...args) => this.emit('error')
            ? console.error(Logger.colorise('FgRed', '[error]'), ...args)
            : null;
        this.object = (object) => {
            const objectMessage = object
                ? getObjectMessage(object)
                : 'No object found to log.';
            return {
                debug: (message) => this.debug(message, objectMessage),
                info: (message) => this.info(message, objectMessage),
                warn: (message) => this.warn(message, objectMessage),
                error: (message) => this.error(message, objectMessage),
            };
        };
        this.kind = (object) => {
            const log = this.info;
            if (!object)
                return log(undefined);
            const objectClass = object.constructor.name;
            const flag = 'kind' in object ? object.kind : object.flags;
            ['NodeObject', 'SourceFileObject'].includes(objectClass)
                ? log('ts.Node:', ts.SyntaxKind[flag])
                : objectClass === 'TypeObject'
                    ? log('ts.Type:', ts.TypeFlags[flag])
                    : objectClass === 'SymbolObject'
                        ? log('ts.Symbol:', ts.SymbolFlags[flag])
                        : this.warn('Could not find kind of constructor: ', object.constructor.name);
        };
        this.emit = (type) => this.logLevels[type] >= this.logLevels[this.logLevel];
    }
}
Logger.colorise = (color, text) => c[color] + text + c.Reset;
exports.default = Logger;
const c = {
    Reset: '\x1b[0m',
    Bright: '\x1b[1m',
    Dim: '\x1b[2m',
    Underscore: '\x1b[4m',
    Blink: '\x1b[5m',
    Reverse: '\x1b[7m',
    Hidden: '\x1b[8m',
    FgBlack: '\x1b[30m',
    FgRed: '\x1b[31m',
    FgGreen: '\x1b[32m',
    FgYellow: '\x1b[33m',
    FgBlue: '\x1b[34m',
    FgMagenta: '\x1b[35m',
    FgCyan: '\x1b[36m',
    FgWhite: '\x1b[37m',
    FgGray: '\x1b[90m',
    BgBlack: '\x1b[40m',
    BgRed: '\x1b[41m',
    BgGreen: '\x1b[42m',
    BgYellow: '\x1b[43m',
    BgBlue: '\x1b[44m',
    BgMagenta: '\x1b[45m',
    BgCyan: '\x1b[46m',
    BgWhite: '\x1b[47m',
    BgGray: '\x1b[100m',
};
function getObjectMessage(object) {
    if (object instanceof dox.Declaration) {
        const { aliasName, tsKind, symbol, node, type, name, fileName, nameSpace, } = object;
        return {
            name,
            aliasName,
            nameSpace,
            tsKind: ts.SyntaxKind[tsKind],
            symbolFlag: ts.SymbolFlags[symbol.flags],
            typeFlag: ts.TypeFlags[type.flags],
            node: node === null || node === void 0 ? void 0 : node.getText(),
            fileName,
        };
    }
}
//# sourceMappingURL=Logger.js.map