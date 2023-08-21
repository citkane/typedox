"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Id {
    constructor() {
        this.id = 0;
    }
    get uid() {
        const id = this.id;
        this.id++;
        return id;
    }
}
exports.default = Id;
//# sourceMappingURL=Id.js.map