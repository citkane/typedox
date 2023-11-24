export const symbolFont = 'material-symbols-outlined';
const symbols = {
    down: 'expand_circle_down',
    package: 'package_2',
    document: 'description',
    settings: 'settings',
    fullscreen: 'fullscreen',
    exitFullscreen: 'fullscreen_exit',
    code: 'folder_data',
};
class Icon extends HTMLElement {
    constructor(symbolSize) {
        super();
        this.symbolSize = symbolSize;
    }
    setSymbol(symbol) {
        const { classList, symbolSize } = this;
        if (!classList.contains(symbolFont))
            classList.add(symbolFont);
        if (!classList.contains('icon'))
            classList.add('icon');
        if (!classList.contains(symbolSize))
            classList.add(symbolSize);
        this.innerHTML = symbols[symbol];
    }
}
export class IconDrawer extends Icon {
    constructor(symbolSize) {
        super(symbolSize);
        this.close = () => {
            this.setAttribute('state', 'closed');
        };
        this.open = () => {
            this.setAttribute('state', 'open');
        };
    }
    connectedCallback() {
        if (!this.getAttribute('state'))
            this.close();
        this.setSymbol('down');
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (!oldValue || oldValue === newValue)
            return;
        oldValue === 'open' && newValue === 'closed'
            ? this.close()
            : this.open();
    }
}
IconDrawer.observedAttributes = ['state'];
export class IconContext extends Icon {
    constructor(symbolSize, symbol) {
        super(symbolSize);
        this.symbol = symbol;
    }
    connectedCallback() {
        this.setSymbol(this.symbol);
    }
}
export class IconFullscreen extends Icon {
    constructor(symbolSize) {
        super(symbolSize);
        if (!this.getAttribute('state'))
            this.closed();
    }
    connectedCallback() {
        this.setSymbol('fullscreen');
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (!oldValue || oldValue === newValue)
            return;
        console.log({ name, oldValue, newValue });
        if (name === 'state') {
            if (newValue === 'opened')
                this.opened();
            if (newValue === 'closed')
                this.closed();
        }
    }
    opened() {
        this.setAttribute('state', 'opened');
        this.setSymbol('exitFullscreen');
    }
    closed() {
        this.setAttribute('state', 'closed');
        this.setSymbol('fullscreen');
    }
}
IconFullscreen.observedAttributes = ['state'];
customElements.define('icon-drawer', IconDrawer);
customElements.define('icon-context', IconContext);
customElements.define('icon-fullscreen', IconFullscreen);
//# sourceMappingURL=ClassesIcons.js.map