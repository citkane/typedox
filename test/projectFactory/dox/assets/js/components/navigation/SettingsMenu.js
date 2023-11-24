import { dom, events, state } from '../../index.js';
import { Menu } from './Menu.js';
export class SettingsMenu extends Menu {
    constructor() {
        super('settings');
    }
    connectedCallback() {
        super.connectedCallback();
        this.appendChild(SettingsMenu.devInfo());
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    static devInfo() {
        const devInfo = dom.makeElement('div', 'section');
        const colourPalette = dom.makeElement('button', null, 'colour palette');
        const rawdata = dom.makeElement('button', null, 'raw data');
        const flushState = dom.makeElement('button', null, 'flush state');
        colourPalette.addEventListener('click', () => events.emit('dev.colourpalette.toggle'));
        devInfo.addEventListener('click', () => {
            events.emit('dev.devinfo.log');
        });
        flushState.addEventListener('click', () => {
            state.flush();
        });
        dom.appendChildren.call(devInfo, [colourPalette, rawdata, flushState]);
        devInfo.setAttribute('title', 'devinfo');
        return devInfo;
    }
}
customElements.define('settings-menu', SettingsMenu);
//# sourceMappingURL=SettingsMenu.js.map