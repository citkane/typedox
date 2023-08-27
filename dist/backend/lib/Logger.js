"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
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
            ? console.error(colorise('Bright', '[debug]'), ...args)
            : null;
        this.info = (...args) => this.emit('info') ? console.info('[info]', ...args) : null;
        this.warn = (...args) => this.emit('warning')
            ? console.warn(colorise('FgYellow', '[warning]'), ...args)
            : null;
        this.error = (...args) => this.emit('error')
            ? console.error(colorise('FgRed', '[error]'), ...args)
            : null;
        this.throwError = (...args) => {
            this.error(...args);
            throw new Error();
        };
        this.emit = (type) => this.logLevels[type] >= this.logLevels[this.logLevel];
        this.class = `[${Logger.initLowerCamel(this.constructor.name)}]`;
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