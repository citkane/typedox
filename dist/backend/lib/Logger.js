"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Logger {
    constructor() {
        this.logLevel = 'info';
        this.debug = (...args) => this.emit('debug') ? console.error('[debug]', ...args) : null;
        this.info = (...args) => this.emit('info') ? console.info('[info]', ...args) : null;
        this.warn = (...args) => this.emit('warning') ? console.warn('[warning]', ...args) : null;
        this.error = (...args) => this.emit('error') ? console.error('[error]', ...args) : null;
        this.logLevels = {
            debug: 0,
            info: 1,
            warning: 2,
            error: 3,
        };
        this.emit = (type) => this.logLevels[type] >= this.logLevels[this.logLevel];
    }
}
exports.default = Logger;
//# sourceMappingURL=Logger.js.map