import { ContentDeclaration, DevColours, IconFullscreen, dom, events, files, router, } from '../../index.js';
export class ChromeMain extends HTMLElement {
    constructor() {
        super();
        this.setContent = (location) => {
            const fileName = 'assets/data/' + location.query + '.json';
            files
                .fetchDataFromFile(fileName)
                .then((rawData) => {
                const newContent = new ContentDeclaration(rawData);
                this.content
                    ? this.replaceChild(newContent, this.content)
                    : this.appendChild(newContent);
                this.content = newContent;
            })
                .catch((err) => {
                console.error(err);
            });
        };
        window.addEventListener('popstate', ({ state }) => this.setContent(state));
        this.fullscreen = dom.makeElement('div', 'fullscreen');
        this.fullscreen.appendChild(new IconFullscreen('md-24'));
        this.fullscreen.addEventListener('click', toggleFullscreen);
        new DevColours();
    }
    connectedCallback() {
        events.on('nav.history.pushState', this.setContent);
        const devInfo = dom.makeElement('div');
        devInfo.id = 'devInfo';
        const location = router.urlToLocation(window.location);
        location && this.setContent(location);
        dom.appendChildren.call(this, [devInfo, this.fullscreen]);
    }
    disconnectedCallback() {
        events.off('nav.history.pushState', this.setContent);
        this.fullscreen.removeEventListener('click', toggleFullscreen);
        window.removeEventListener('popstate', ({ state }) => this.setContent(state));
    }
}
customElements.define('chrome-main', ChromeMain);
const elem = document.body;
document.exitFullscreen = document.exitFullscreen
    ? document.exitFullscreen
    : document.webkitExitFullscreen
        ? document.webkitExitFullscreen
        : document.msExitFullscreen
            ? document.msExitFullscreen
            : undefined;
elem.requestFullscreen = elem.requestFullscreen
    ? elem.requestFullscreen
    : elem.webkitRequestFullscreen
        ? elem.webkitRequestFullscreen
        : elem.msRequestFullscreen
            ? elem.msRequestFullscreen
            : undefined;
function toggleFullscreen(e) {
    e.stopPropagation();
    if (!document.exitFullscreen || !elem.requestFullscreen)
        return;
    const icon = e.target;
    const isFullscreen = window.fullScreen ||
        (window.innerWidth == screen.width &&
            window.innerHeight == screen.height);
    isFullscreen
        ? document
            .exitFullscreen()
            .then(() => icon.setAttribute('state', 'closed'))
        : elem
            .requestFullscreen()
            .then(() => icon.setAttribute('state', 'opened'));
}
//# sourceMappingURL=ChromeMain.js.map