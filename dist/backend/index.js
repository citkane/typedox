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
const path = __importStar(require("path"));
const dox = __importStar(require("./typedox"));
//const inputFile = 'test/scenarios/locals/index.ts';
//const configFolder = 'test/scenarios/locals';
const inputFile = 'test/scenarios/namespace/index.ts';
const configFolder = 'test/scenarios/namespace';
//const inputFile = 'src/frontend/index.ts';
//const configFolder = 'src';
const projectRoot = path.join(__dirname, '../../');
const configDir = path.join(projectRoot, configFolder);
const inputPath = path.join(projectRoot, inputFile);
const configFile = ts.findConfigFile(configDir, ts.sys.fileExists);
if (configFile)
    parseConfig(configFile, path.dirname(configFile));
function parseConfig(configFile, baseDir) {
    var _a;
    const config = dox.lib.loadConfigFromFile(configFile, baseDir);
    //dox.log.info(config);
    config.options.types = [];
    //config.options.noLib = true;
    (_a = config.projectReferences) === null || _a === void 0 ? void 0 : _a.forEach((reference) => {
        if (reference.originalPath === './src/tsconfig.frontend.json')
            parseConfig(reference.path, path.dirname(reference.path));
    });
    if (!config.fileNames.length)
        return;
    const program = ts.createProgram(config.fileNames, config.options);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    diagnostics.forEach((diagnosis) => {
        dox.log.error(diagnosis.messageText);
    });
    const checker = program.getTypeChecker();
    const id = new dox.lib.Id();
    const context = new dox.lib.Context(checker, program, config, id, undefined);
    // new DoxPackage(context, config.fileNames);
    new dox.Package(context, [inputPath]);
    /*
  
  const program = ts.createProgram([inputFilename],);
  const entrySourceFile = program.getSourceFile(inputFilename);
  const checker = program.getTypeChecker();
  const doxContext = new DoxContext(checker, program);
  
  new DoxPackage(doxContext, [entrySourceFile]);
  */
}
//# sourceMappingURL=index.js.map