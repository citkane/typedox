import { events, state } from '../../index.js';
export class Menu extends HTMLElement {
    constructor(context) {
        super();
        this.toggleState = (context) => {
            context === this.context
                ? this.setAttribute('state', 'active')
                : this.removeAttribute('state');
        };
        this.setScrollState = () => {
            state.menuScrollTop = this.scrollTop;
        };
        this.context = context;
        events.on('nav.context.switch', this.toggleState);
        this.addEventListener('scrollend', () => this.setScrollState());
    }
    connectedCallback() {
        this.classList.add('menu');
    }
    disconnectedCallback() {
        events.off('nav.context.switch', this.toggleState);
        this.removeEventListener('scrollend', () => this.setScrollState());
    }
}
//# sourceMappingURL=Menu.js.map