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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.logLevels = void 0;
const ts = __importStar(require("typescript"));
var logLevels;
(function (logLevels) {
    logLevels[logLevels["debug"] = 0] = "debug";
    logLevels[logLevels["info"] = 1] = "info";
    logLevels[logLevels["warn"] = 2] = "warn";
    logLevels[logLevels["error"] = 3] = "error";
})(logLevels || (exports.logLevels = logLevels = {}));
class Logger {
    constructor() {
        this.logLevel = logLevels.debug;
        this.debug = (...args) => this.shouldEmit(logLevels.debug)
            ? console.error(colorise('Bright', '[debug]'), ...args)
            : null;
        this.info = (...args) => this.shouldEmit(logLevels.info)
            ? console.info('[info]', ...args)
            : null;
        this.infoKind = (kind) => this.info(ts.SyntaxKind[kind]);
        this.infoFlagSymbol = (flag) => this.info(ts.SymbolFlags[flag]);
        this.infoFlagType = (flag) => this.info(ts.TypeFlags[flag]);
        this.warn = (...args) => this.shouldEmit(logLevels.warn)
            ? console.warn(colorise('FgYellow', '[warning]'), ...args)
            : null;
        this.error = (...args) => this.shouldEmit(logLevels.error)
            ? console.error(colorise('FgRed', '[error]'), ...args)
            : null;
        this.throwError = (...args) => {
            this.error(...args);
            throw new Error();
        };
        this.shouldEmit = (logLevel) => logLevel >= this.logLevel;
    }
    get class() {
        return `[${Logger.initLowerCamel(this.constructor.name)}]`;
    }
    static initLowerCamel(word) {
        return word[0].toLocaleLowerCase() + word.slice(1);
    }
    static class() {
        return `[${this.name}]`;
    }
}
_a = Logger;
Logger.logger = new Logger();
Logger.debug = _a.logger.debug;
Logger.info = _a.logger.info;
Logger.infoKind = _a.logger.infoKind;
Logger.infoFlagSymbol = _a.logger.infoFlagSymbol;
Logger.infoFlagType = _a.logger.infoFlagType;
Logger.warn = _a.logger.warn;
Logger.error = _a.logger.error;
Logger.throwError = _a.logger.throwError;
exports.default = Logger;
const colorise = (color, text) => c[color] + text + c.Reset;
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
//# sourceMappingURL=Logger.js.map