import * as path from "path";
import {
  Extractor,
  ExtractorConfig,
  ExtractorResult,
  ExtractorMessage,
  ConsoleMessageId,
  ExtractorLogLevel,
} from "@microsoft/api-extractor";
import { ApiModel, ApiPackage } from "@microsoft/api-extractor-model";
const projectFolder = path.join(__dirname, "../../");
const apiFile = path.join(projectFolder, "temp/typedox.api.json");

//const extractorConfig: ExtractorConfig = ExtractorConfig.loadFileAndPrepare(apiExtractorJsonPath);
const extractorConfig: ExtractorConfig = ExtractorConfig.prepare({
  packageJsonFullPath: path.join(projectFolder, "package.json"),
  configObject: {
    mainEntryPointFilePath: path.join(
      projectFolder,
      "./dist/frontend/index.d.ts"
    ),
    projectFolder,
    compiler: { tsconfigFilePath: "tsconfig.json" },
    docModel: {
      enabled: true,
      apiJsonFilePath: "<projectFolder>/temp/<unscopedPackageName>.api.json",
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
const extractorResult: ExtractorResult = Extractor.invoke(extractorConfig, {
  localBuild: true,
  showVerboseMessages: true,
  messageCallback: (message: ExtractorMessage) => {
    switch (message.messageId) {
      case ConsoleMessageId.ApiReportCreated:
        // This script deletes the outputs for a clean build, so don't issue a warning if the file gets created
        message.logLevel = ExtractorLogLevel.None;
        break;
      case ConsoleMessageId.Preamble:
        // Less verbose output
        message.logLevel = ExtractorLogLevel.None;
        break;
    }
  },
});

const apiModel: ApiModel = new ApiModel();
const apiPackage: ApiPackage = apiModel.loadPackage(apiFile);

for (const member of apiPackage.members) {
  //const foo = {};
  //member.parent.serializeInto(foo);
  //console.log(JSON.stringify(foo, null, 4));
}

//console.log(extractorResult.compilerState.program);
//console.log(extractorResult.compilerState.program["writeFile"].toString());
