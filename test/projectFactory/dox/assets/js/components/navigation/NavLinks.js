import { dom, events, router, state } from '../../index.js';
export class NavLink extends HTMLElement {
    constructor(text, location) {
        super();
        this.route = (event) => {
            router.route(this.location);
        };
        this.link = dom.makeElement('a', '', text);
        this.location = location;
    }
    connectedCallback() {
        this.style.cursor = 'pointer';
        this.appendChild(this.link);
        this.addEventListener('click', this.route);
    }
    disconnectedCallback() {
        this.removeEventListener('click', this.route);
    }
}
export class NavContext extends HTMLElement {
    constructor(context, icon) {
        super();
        this.setState = (event) => {
            event === null || event === void 0 ? void 0 : event.stopPropagation();
            this.setAttribute('state', 'active');
            state.menuContext = this.context;
        };
        this.toggleState = (context) => {
            if (context === this.context)
                return this.setState();
            this.removeAttribute('state');
        };
        this.icon = icon;
        this.context = context;
    }
    connectedCallback() {
        this.setAttribute('context', this.context);
        this.appendChild(this.icon);
        this.addEventListener('click', this.setState);
        events.on('nav.context.switch', this.toggleState);
    }
    disconnectedCallback() {
        this.removeEventListener('click', this.setState);
        events.off('nav.context.switch', this.toggleState);
    }
}
customElements.define('nav-link', NavLink);
customElements.define('nav-context', NavContext);
//# sourceMappingURL=NavLinks.js.map