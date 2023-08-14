"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = require("typescript");
const Dox_1 = __importDefault(require("../Dox"));
const types_1 = require("../types");
const Logger_1 = require("../Logger");
const logger = new Logger_1.Logger();
class ExportMemberDox extends Dox_1.default {
    constructor(context, value, type) {
        super(context);
        this.parents = new Map();
        this.kind = types_1.DoxKind.ExportMember;
        this.getParentMembers = (parentMembers = new Map()) => {
            this.parents.forEach((parent) => {
                if (!parentMembers.has(parent.id))
                    parentMembers.set(parent.id, parent);
            });
            return parentMembers;
        };
        this.value = value;
        const { getNames, getSymbol } = ExportMemberDox;
        switch (this.isExportSpecifier) {
            case true:
                const specifier = value;
                const { name, alias } = getNames(specifier);
                this.name = name;
                this.alias = alias;
                this.symbol = getSymbol(this.name, type, this.alias);
                break;
            case false:
                const symbol = value;
                this.name = symbol.getName();
                this.alias = undefined;
                this.symbol = symbol;
                break;
        }
        this.exportDeclaration.registerMember(this);
    }
    get isExportSpecifier() {
        return ('kind' in this.value &&
            this.value.kind === typescript_1.SyntaxKind.ExportSpecifier);
    }
    static getSymbol(name, type, alias) {
        let symbol = type.getProperty(name);
        symbol = !!symbol ? symbol : type.getProperty(alias);
        if (!symbol)
            logger.error(`Could not find property "${name}" ${!!alias ? 'with alias "' + alias + '"' : ''} in ${type.symbol.getName()}`);
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