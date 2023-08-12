"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = require("typescript");
const Dox_1 = __importDefault(require("../Dox"));
const types_1 = require("../types");
class ExportMemberDox extends Dox_1.default {
    value;
    kind = types_1.DoxKind.ExportMember;
    name;
    alias;
    symbol;
    constructor(context, value, type) {
        super(context);
        this.value = value;
        const { getNames, getSymbol } = ExportMemberDox;
        switch (this.isExportSpecifier) {
            case true:
                const specifier = value;
                const { name, alias } = getNames(specifier);
                this.name = name;
                this.alias = alias;
                this.symbol = getSymbol(this.name, this.alias, type);
                break;
            case false:
                const symbol = value;
                this.name = symbol.getName();
                this.alias = undefined;
                this.symbol = symbol;
                break;
        }
        this.exportDeclaration.members.set(this.id, this);
    }
    get isExportSpecifier() {
        return (Object.hasOwn(this.value, "kind") &&
            this.value.kind === typescript_1.SyntaxKind.ExportSpecifier);
    }
    static getSymbol(name, alias, type) {
        let symbol = type?.getProperty(name);
        symbol = !!symbol ? symbol : type?.getProperty(alias);
        return symbol;
    }
    static getNames(specifier) {
        const name = specifier.getFirstToken().getText();
        const nameAlias = specifier.getLastToken().getText();
        return {
            name,
            alias: nameAlias === name ? undefined : nameAlias,
        };
    }
}
exports.default = ExportMemberDox;
//# sourceMappingURL=ExportMemberDox.js.map