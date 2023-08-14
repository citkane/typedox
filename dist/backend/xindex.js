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
const path = __importStar(require("path"));
const api_extractor_1 = require("@microsoft/api-extractor");
const api_extractor_model_1 = require("@microsoft/api-extractor-model");
const projectFolder = path.join(__dirname, '../../');
const apiFile = path.join(projectFolder, 'temp/typedox.api.json');
//const extractorConfig: ExtractorConfig = ExtractorConfig.loadFileAndPrepare(apiExtractorJsonPath);
const extractorConfig = api_extractor_1.ExtractorConfig.prepare({
    packageJsonFullPath: path.join(projectFolder, 'package.json'),
    configObject: {
        mainEntryPointFilePath: path.join(projectFolder, './dist/frontend/index.d.ts'),
        projectFolder,
        compiler: { tsconfigFilePath: 'tsconfig.json' },
        docModel: {
            enabled: true,
            apiJsonFilePath: '<projectFolder>/temp/<unscopedPackageName>.api.json',
        },
        /*
    dtsRollup: {
      enabled: true,
      untrimmedFilePath: "<projectFolder>/temp/<unscopedPackageName>.d.ts",
    },
    */
    },
    configObjectFullPath: undefined,
});
const extractorResult = api_extractor_1.Extractor.invoke(extractorConfig, {
    localBuild: true,
    showVerboseMessages: true,
    messageCallback: (message) => {
        switch (message.messageId) {
            case "console-api-report-created" /* ConsoleMessageId.ApiReportCreated */:
                // This script deletes the outputs for a clean build, so don't issue a warning if the file gets created
                message.logLevel = "none" /* ExtractorLogLevel.None */;
                break;
            case "console-preamble" /* ConsoleMessageId.Preamble */:
                // Less verbose output
                message.logLevel = "none" /* ExtractorLogLevel.None */;
                break;
        }
    },
});
const apiModel = new api_extractor_model_1.ApiModel();
const apiPackage = apiModel.loadPackage(apiFile);
for (const member of apiPackage.members) {
    //const foo = {};
    //member.parent.serializeInto(foo);
    //console.log(JSON.stringify(foo, null, 4));
}
//console.log(extractorResult.compilerState.program);
//console.log(extractorResult.compilerState.program["writeFile"].toString());
//# sourceMappingURL=xindex.js.map