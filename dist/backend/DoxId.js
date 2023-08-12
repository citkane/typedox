"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DoxId {
    id = 0;
    get uid() {
        const id = this.id;
        this.id++;
        return id;
    }
}
exports.default = DoxId;
//# sourceMappingURL=DoxId.js.map