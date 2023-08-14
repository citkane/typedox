export class Logger {
	logLevel: keyof typeof this.logLevels = 'info';

	debug = (...args: any) =>
		this.emit('debug') ? console.error('[debug]', ...args) : null;
	info = (...args: any) =>
		this.emit('info') ? console.info('[info]', ...args) : null;
	warn = (...args: any) =>
		this.emit('warning') ? console.warn('[warning]', ...args) : null;
	error = (...args: any) =>
		this.emit('error') ? console.error('[error]', ...args) : null;

	private logLevels = {
		debug: 0,
		info: 1,
		warning: 2,
		error: 3,
	};
	private emit = (type: keyof typeof this.logLevels) =>
		this.logLevels[type] >= this.logLevels[this.logLevel];
}
