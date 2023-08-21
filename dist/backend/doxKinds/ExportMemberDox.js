"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts = __importStar(require("typescript"));
const Dox_1 = __importDefault(require("../Dox"));
const typeDox_1 = require("../typeDox");
const Logger_1 = require("../Logger");
const logger = new Logger_1.Logger();
class ExportMemberDox extends Dox_1.default {
    constructor(context, value, type) {
        super(context);
        this.parents = new Map();
        this.kind = typeDox_1.DoxKind.ExportMember;
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
        logger.info(this.symbol);
        this.exportDeclaration.registerMember(this);
    }
    get isExportSpecifier() {
        return ('kind' in this.value &&
            this.value.kind ===
                ts.SyntaxKind.ExportSpecifier);
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