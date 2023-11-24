import { state } from '../index.js';
import { dom } from '../lib/_index.js';
const seen = new Set();
const resizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
        const { target } = entry;
        if (!seen.has(target.id)) {
            seen.add(target.id);
            return;
        }
        const { clientHeight: Y, clientWidth: X } = target;
        state.resize = [target.id, { X, Y }];
    });
});
export function makeResizeable(target, direction = 'X', id, min = () => 120, max = () => 900) {
    let _min, _max, offset = 0, brake;
    const resizeCursor = direction === 'X' ? 'col-resize' : 'row-resize';
    const eventKey = direction === 'X' ? 'clientX' : 'clientY';
    const styleKey = direction === 'X' ? 'width' : 'height';
    const trigger = dom.makeElement('div', `widget resizehandle ${direction}`);
    const initSize = state.resizes(id)[direction];
    trigger.style.cursor = resizeCursor;
    trigger.addEventListener('mousedown', initDrag);
    target.id = id;
    target.classList.add('resizeable');
    target.style[styleKey] = initSize + 'px';
    target.appendChild(trigger);
    resizeObserver.observe(target);
    return disconnectedCallback;
    function initDrag(event) {
        event.stopPropagation();
        document.body.classList.add('resizing', direction);
        const bounds = target.getBoundingClientRect();
        _min = min();
        _max = max();
        offset = direction === 'X' ? bounds.x : bounds.y;
        document.body.addEventListener('mousemove', track);
        document.body.addEventListener('mouseup', unTrack);
    }
    function unTrack(event) {
        event.stopPropagation();
        document.body.removeEventListener('mousemove', track);
        document.body.classList.remove('resizing', direction);
    }
    function track(event) {
        event.stopPropagation();
        if (!!brake)
            return;
        brake = setTimeout(() => {
            brake = undefined;
        }, 30);
        const value = event[eventKey] - offset;
        if (value >= _min && value <= _max) {
            target.style[styleKey] = value + 'px';
        }
    }
    function disconnectedCallback() {
        resizeObserver.unobserve(target);
        trigger.removeEventListener('mousedown', initDrag);
        document.body.removeEventListener('mouseup', unTrack);
        document.body.removeEventListener('mousemove', track);
    }
}
//# sourceMappingURL=factoryWidgets.js.map