import { dom } from './_index.js';

export const fontOutlined = 'material-icons-outlined';
export const fontFilled = 'material-icons-sharp';
export const fontIcons = {
	down: 'expand_circle_down',
};

export function makeResizeable(
	target: HTMLElement,
	direction: 'X' | 'Y' = 'X',
	min = () => 120,
	max = () => 900,
) {
	let _min!: number,
		_max!: number,
		offset = 0,
		brake: ReturnType<typeof setTimeout> | undefined;

	const resizeCursor = direction === 'X' ? 'col-resize' : 'row-resize';
	const eventKey = direction === 'X' ? 'clientX' : 'clientY';
	const styleKey = direction === 'X' ? 'width' : 'height';

	const trigger = dom.makeElement('div', 'trigger');
	trigger.style.cursor = resizeCursor;
	trigger.addEventListener('mousedown', initDrag);
	target.appendChild(trigger);

	return disconnectedCallback;

	function initDrag(event: MouseEvent) {
		event.stopPropagation();

		const bounds = target.getBoundingClientRect();
		_min = min();
		_max = max();
		offset = direction === 'X' ? bounds.x : bounds.y;

		document.body.addEventListener('mousemove', track);
		document.body.addEventListener('mouseup', unTrack);
	}
	function unTrack(event: MouseEvent) {
		event.stopPropagation();

		document.body.style.cursor = 'default';
		document.body.removeEventListener('mousemove', track);
	}
	function track(event: MouseEvent) {
		event.stopPropagation();

		if (!!brake) return;
		brake = setTimeout(() => {
			brake = undefined;
		}, 30);

		document.body.style.cursor = resizeCursor;
		const value = event[eventKey] - offset;
		if (value >= _min && value <= _max) {
			target.style[styleKey] = value + 'px';
		}
	}
	function disconnectedCallback() {
		trigger.removeEventListener('mousedown', initDrag);
		document.body.removeEventListener('mouseup', unTrack);
		document.body.removeEventListener('mousemove', track);
	}
}
