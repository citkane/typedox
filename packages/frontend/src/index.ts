import { initEnums } from './toolBox/_index.js';

export * from './toolBox/_index.js';
export * from './components/_index.js';
export * as router from './router.js';

export function doxApp() {
	initEnums()
		.then(() => import('./components/DoxApp.js'))
		.then((DoxAppClass) => DoxAppClass.default)
		.then((DoxApp) => new DoxApp())
		.then((doxApp) => {
			document.body.appendChild(doxApp);
			return doxApp;
		})
		.catch((err) => console.error(err));
}
(window as any).doxApp = doxApp;
