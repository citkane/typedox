import { readConfigFile, sys, parseJsonConfigFileContent } from "typescript";

import DoxContext from "./DoxContext";
import DoxPackage from "./DoxPackage";
import ExportDeclarationDox from "./doxKinds/ExportDeclarationDox";

export default class Dox {
  context: DoxContext;
  package?: DoxPackage;
  exportDeclaration: ExportDeclarationDox;
  id: number;
  constructor(context: DoxContext) {
    this.context = context;
    this.id = context.id.uid;
    this.package = context.package;
    this.exportDeclaration = context.exportDeclaration;
  }

  static loadConfigFromFile(filePath: string, baseDir: string) {
    const configObject = readConfigFile(filePath, sys.readFile).config;
    const config = parseJsonConfigFileContent(configObject, sys, baseDir, {});
    return config;
  }
}
