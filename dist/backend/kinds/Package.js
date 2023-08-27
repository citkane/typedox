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
const dox = __importStar(require("../typedox"));
const ts = __importStar(require("typescript"));
const { Logger } = dox.lib;
class Package extends Logger {
    constructor(name, version) {
        super();
        this.references = new Map();
        this.makeReference = (config, name) => {
            config.options.types = [];
            const program = ts.createProgram(config.fileNames, config.options);
            const diagnostics = ts.getPreEmitDiagnostics(program);
            if (diagnostics.length) {
                diagnostics.forEach((diagnosis) => {
                    this.warn(this.class, diagnosis.messageText);
                    this.debug(diagnosis.relatedInformation);
                });
                this.throwError(this.class, 'TSC diagnostics failed.');
            }
            const checker = program.getTypeChecker();
            const id = new dox.lib.Id();
            const context = new dox.lib.Context(checker, program, config, id, this, undefined);
            this.references.set(name, new dox.Reference(context, name, config.fileNames));
        };
        Package.class.bind(this);
        this.version = version;
        this.name = name;
    }
}
exports.default = Package;
//# sourceMappingURL=Package.js.map