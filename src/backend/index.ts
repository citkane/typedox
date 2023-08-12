import * as ts from "typescript";
import * as path from "path";
import DoxPackage from "./DoxPackage";
import DoxContext from "./DoxContext";
import Dox from "./Dox";
import Id from "./Id";

const projectRoot = path.join(__dirname, "../../");
const inputFilename = path.join(projectRoot, "src/frontend/index.ts");
const configFile = ts.findConfigFile(projectRoot, ts.sys.fileExists);
if (configFile) parseConfig(configFile, projectRoot);

function parseConfig(configFile: string, baseDir: string) {
  const config = Dox.loadConfigFromFile(configFile, baseDir);
  config.options.types = [];
  config.options.noLib = true;
  config.projectReferences?.forEach((reference) => {
    if (reference.originalPath === "./src/tsconfig.frontend.json")
      parseConfig(reference.path, path.dirname(reference.path));
  });
  if (!config.fileNames.length) return;

  const program = ts.createProgram(config.fileNames, config.options);
  const checker = program.getTypeChecker();
  const id = new Id();
  const context = new DoxContext(checker, program, config, id);
  // new DoxPackage(context, config.fileNames);
  new DoxPackage(context, [inputFilename]);
  /*
  
  const program = ts.createProgram([inputFilename],);
  const entrySourceFile = program.getSourceFile(inputFilename);
  const checker = program.getTypeChecker();
  const doxContext = new DoxContext(checker, program);
  
  new DoxPackage(doxContext, [entrySourceFile]);
  */
}
