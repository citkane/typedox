import Dox from "./Dox";
import DoxContext from "./DoxContext";
import { DoxKind, fileMap } from "./types";
export default class DoxPackage extends Dox {
    kind: DoxKind;
    declarationsMap: fileMap;
    constructor(context: DoxContext, entryFileList: string[]);
    addEntryFile: (fileName: string) => void;
    private addEntryFiles;
    private registerFilesWithSelf;
    private getEntrySources;
    private deDupeFilelist;
    private registerExportDeclarations;
    private parseForDeclarations;
    private static getExportDeclarationsFromNode;
    private static declarationsContainer;
    private static declarationsMap;
}
