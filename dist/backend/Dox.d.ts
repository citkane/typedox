import DoxContext from "./DoxContext";
import DoxPackage from "./DoxPackage";
import ExportDeclarationDox from "./doxKinds/ExportDeclarationDox";
export default class Dox {
    context: DoxContext;
    package?: DoxPackage;
    exportDeclaration: ExportDeclarationDox;
    id: number;
    constructor(context: DoxContext);
    static loadConfigFromFile(filePath: string, baseDir: string): import("typescript").ParsedCommandLine;
}
