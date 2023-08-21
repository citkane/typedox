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
class Package extends dox.lib.Dox {
    constructor(context, entryFileList) {
        super(context);
        this.name = 'todo';
        this.version = 'todo';
        this.kind = dox.Kind.Package;
        this.filesMap = new Map();
        this.addEntryFiles = (fileNames) => {
            fileNames = this.deDupeFilelist(fileNames);
            this.makeSourceFiles(fileNames);
        };
        super.package = this;
        this.addEntryFiles(entryFileList);
        this.filesMap.forEach((file) => file.buildRelationships());
        this.tree = new dox.tree.Tree(this);
        //dox.log.info(this.tree.toObject());
    }
    makeSourceFiles(fileList) {
        const context = Object.assign(Object.assign({}, this.context), { package: this });
        const { program } = context;
        const fileSources = fileList
            .map((fileName) => program.getSourceFile(fileName))
            .filter((source, i) => (!!source ? source : warning(i)));
        fileSources.forEach((source) => {
            const sourceFile = new dox.SourceFile(context, source);
            this.filesMap.set(sourceFile.fileName, sourceFile);
            this.addEntryFiles(sourceFile.childFiles);
        });
        function warning(i) {
            const message = `No source file was found for "${fileList[i]}"`;
            dox.log.warn(message);
            return false;
        }
    }
    deDupeFilelist(fileList) {
        return fileList.filter((file) => !this.filesMap.has(file));
    }
}
exports.default = Package;
//# sourceMappingURL=Package.js.map