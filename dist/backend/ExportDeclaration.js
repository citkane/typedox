"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const TypeDox_1 = __importDefault(require("./TypeDox"));
class exportDeclaration extends TypeDox_1.default {
    constructor(checker, program) {
        super(checker, program);
    }
}
exports.default = exportDeclaration;
//# sourceMappingURL=ExportDeclaration.js.map