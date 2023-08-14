import { trigger } from './triggers.js';

import * as content from './actionsContent.js';
import * as menu from './actionsMenu.js';
import * as drawers from './actionsDrawers.js';
import * as options from './actionsOptions.js';
export { content, menu, drawers, options };

/**
 * Notifies the content or menu DOM that it needs to scroll to the given location
 * @param target
 * @param context
 * @returns
 */
export type scrollTo = { target: number | string };
export const scrollTo = (
	context: 'menu' | 'content',
	target: scrollTo['target'],
) =>
	new CustomEvent<scrollTo>(trigger[context].scrollTo, {
		detail: { target },
	});