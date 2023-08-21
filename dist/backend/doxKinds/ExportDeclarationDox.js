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
const typeDox_1 = require("../typeDox");
const Dox_1 = __importDefault(require("../Dox"));
const ExportMemberDox_1 = __importDefault(require("./ExportMemberDox"));
class ExportDeclarationDox extends Dox_1.default {
    constructor(context, declaration) {
        super(context);
        this.kind = typeDox_1.DoxKind.ExportDeclaration;
        this.parentFiles = [];
        this.membersMap = new Map();
        const { getNameSpace, getExportTargetFile } = ExportDeclarationDox;
        this.declaration = declaration;
        this.exportSourceFile = declaration.getSourceFile().fileName;
        this.moduleSymbol = this.getModuleSymbol();
        this.exportTargetFile = getExportTargetFile(this.moduleSymbol);
        this.nameSpace = getNameSpace(declaration);
        const { exportTargetFile, moduleType, sourceType } = this;
        const type = moduleType || sourceType;
        this.makeMembers(type);
        this.package.registerExportDeclaration(this);
        this.package.addEntryFile(exportTargetFile);
    }
    registerMember(member) {
        this.membersMap.set(member.name, member);
    }
    makeMembers(type) {
        const namedExport = this.namedExport;
        const context = Object.assign(Object.assign({}, this.context), { exportDeclaration: this });
        const members = !!namedExport
            ? namedExport.elements.map((specifier) => new ExportMemberDox_1.default(context, specifier, type))
            : type
                .getProperties()
                .map((symbol) => new ExportMemberDox_1.default(context, symbol));
    }
    get namedExport() {
        return this.declaration
            .getChildren()
            .find((node) => ts.isNamedExports(node));
    }
    getModuleSymbol() {
        if (!('moduleSpecifier' in this.declaration))
            return undefined;
        const { checker } = this.context;
        const { moduleSpecifier } = this.declaration;
        return checker.getSymbolAtLocation(moduleSpecifier);
    }
    get moduleType() {
        const { checker } = this.context;
        const symbol = this.moduleSymbol;
        return symbol ? checker.getTypeOfSymbol(symbol) : undefined;
    }
    get sourceType() {
        const { checker } = this.context;
        const symbol = checker.getSymbolAtLocation(this.declaration.parent.getSourceFile());
        return checker.getTypeOfSymbol(symbol);
    }
}
ExportDeclarationDox.getExportTargetFile = (module) => {
    var _a;
    if (!module)
        return undefined;
    return (_a = module.valueDeclaration) === null || _a === void 0 ? void 0 : _a.getSourceFile().fileName;
};
ExportDeclarationDox.getNameSpace = (declaration) => {
    const node = declaration
        .getChildren()
        .find((node) => ts.isNamespaceExport(node));
    return node === null || node === void 0 ? void 0 : node.name.getText();
};
exports.default = ExportDeclarationDox;
//# sourceMappingURL=ExportDeclarationDox.js.map