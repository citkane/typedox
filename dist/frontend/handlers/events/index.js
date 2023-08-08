import { trigger } from "./triggers.js";
import * as content from "./actionsContent.js";
import * as menu from "./actionsMenu.js";
import * as drawers from "./actionsDrawers.js";
import * as options from "./actionsOptions.js";
export { content, menu, drawers, options };
export const scrollTo = (context, target) => new CustomEvent(trigger[context].scrollTo, {
    detail: { target },
});
//# sourceMappingURL=index.js.map