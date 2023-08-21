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
Object.defineProperty(exports, "__esModule", { value: true });
const ts = __importStar(require("typescript"));
const dox = __importStar(require("../typedox"));
class ExportMemberDox extends dox.Dox {
    constructor(context, value, type) {
        super(context);
        //parents: Map<number, ExportMemberDox> = new Map();
        this.kind = dox.Kind.ExportMember;
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
        //this.exportDeclaration!.registerMember(this);
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
            dox.log.error(`Could not find property "${name}" ${!!alias ? 'with alias "' + alias + '"' : ''} in ${type.symbol.getName()}`);
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
//# sourceMappingURL=ExportMember.js.map