"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typescript_1 = require("typescript");
class Dox {
    constructor(context) {
        this.context = context;
        this.id = context.id.uid;
        this.package = context.package;
        this.exportDeclaration = context.exportDeclaration;
    }
    static loadConfigFromFile(filePath, baseDir) {
        const configObject = (0, typescript_1.readConfigFile)(filePath, typescript_1.sys.readFile).config;
        const config = (0, typescript_1.parseJsonConfigFileContent)(configObject, typescript_1.sys, baseDir, {});
        return config;
    }
}
exports.default = Dox;
//# sourceMappingURL=Dox.js.map