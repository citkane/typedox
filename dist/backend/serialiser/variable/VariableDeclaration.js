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
const dox = __importStar(require("../../typedox"));
const Serialiser_1 = __importDefault(require("../Serialiser"));
class VariableDeclaration extends Serialiser_1.default {
    constructor(declaration) {
        var _a, _b;
        super(declaration);
        this.declaration = declaration;
        this.isLiteral
            ? this.Literal()
            : this.isNewExpression
                ? this.isNewMap
                    ? this.NewMap()
                    : this.NewObject()
                : this.isObjectLiteral
                    ? this.ObjectLiteral()
                    : dox.log.warn(ts.SyntaxKind[(_a = this.nodeLastChild) === null || _a === void 0 ? void 0 : _a.kind], `An unknown type of VariableDeclaration was encountered: ${(_b = this.node) === null || _b === void 0 ? void 0 : _b.getText()}`);
    }
    Literal() {
        //dox.log.info(this.symbol.name);
        this.serialise = () => {
            return {};
        };
    }
    ObjectLiteral() {
        this.serialise = () => {
            return {};
        };
    }
    NewMap(newExpression = this.nodeLastChild) {
        //dox.log.info(this.checker.typeToString(this.declaration.type));
        //dox.log.info(this.checker.getTypeOfSymbol(prop));
        //dox.log.info(this.checker.getTypeOfSymbolAtLocation(prop!, node));
        //dox.log.info(ts.SyntaxKind[this.node.parent.getChildAt(0).kind]);
        //dox.log.info(newExpression.typeArguments);
        //this.getTypesFromArguments(newExpression.arguments);
    }
    NewObject(newExpression = this.nodeLastChild) { }
}
exports.default = VariableDeclaration;
//# sourceMappingURL=VariableDeclaration.js.map