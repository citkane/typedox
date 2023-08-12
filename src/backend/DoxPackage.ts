import {
  ClassDeclaration,
  ExportDeclaration,
  ImportDeclaration,
  InterfaceDeclaration,
  Node,
  SourceFile,
  SyntaxKind,
  TypeAliasDeclaration,
  VariableDeclarationList,
  isExportDeclaration,
} from "typescript";
import Dox from "./Dox";
import ExportDeclarationDox from "./doxKinds/ExportDeclarationDox";
import DoxContext from "./DoxContext";
import { DoxKind, declarationKinds, declarationMaps, fileMap } from "./types";

export default class DoxPackage extends Dox {
  kind = DoxKind.Package;
  declarationsMap: fileMap = new Map();

  constructor(context: DoxContext, entryFileList: string[]) {
    super(context);

    this.addEntryFiles(entryFileList);
  }

  public addEntryFile = (fileName: string) => this.addEntryFiles([fileName]);
  private addEntryFiles = (fileNames: string[]) => {
    fileNames = this.deDupeFilelist(fileNames);
    const entrySources = this.getEntrySources(fileNames);
    const declarations = this.parseForDeclarations(entrySources);
    this.registerFilesWithSelf(fileNames);
    this.registerExportDeclarations(declarations.exports);
  };

  private registerFilesWithSelf(fileNames: string[]) {
    const { declarationsMap } = DoxPackage;
    fileNames.forEach((fileName) =>
      this.declarationsMap.set(fileName, declarationsMap())
    );
  }

  private getEntrySources(fileList: string[]) {
    const { program } = this.context;
    return fileList.map((fileName) => program.getSourceFile(fileName));
  }
  private deDupeFilelist(fileList: string[]) {
    return fileList.filter((file) => !this.declarationsMap.has(file));
  }
  private registerExportDeclarations = (
    exportDeclarations: ExportDeclaration[]
  ) => {
    const context = { ...this.context, package: this };
    exportDeclarations.forEach((exportDeclaration) => {
      new ExportDeclarationDox(context, exportDeclaration);
    });
  };

  private parseForDeclarations(sources: SourceFile[]) {
    const { declarationsContainer: declarationContainer } = DoxPackage;
    const declarations = declarationContainer();
    const { exports, imports, classes, variables, types, interfaces } =
      declarations;
    sources.forEach((source) => parse(source));

    return declarations;

    function parse(node: Node) {
      switch (node.kind) {
        case SyntaxKind.ExportDeclaration:
          exports.push(node as ExportDeclaration);
          break;
        case SyntaxKind.ImportDeclaration:
          imports.push(node as ImportDeclaration);
          break;
        case SyntaxKind.ClassDeclaration:
          classes.push(node as ClassDeclaration);
          break;
        case SyntaxKind.VariableDeclarationList:
          variables.push(node as VariableDeclarationList);
          break;
        case SyntaxKind.InterfaceDeclaration:
          interfaces.push(node as InterfaceDeclaration);
          break;
        case SyntaxKind.TypeAliasDeclaration:
          types.push(node as TypeAliasDeclaration);
          break;

        default:
          const kind = SyntaxKind[node.kind];
          if (kind.indexOf("Declaration") > 0)
            console.log(SyntaxKind[node.kind], ":", node.getText());
          node.forEachChild((child) => parse(child));
      }
    }
  }
  private static getExportDeclarationsFromNode = (
    node: Node,
    exportDeclarations: ExportDeclaration[] = []
  ) => {
    node.forEachChild((childNode) => {
      isExportDeclaration(childNode)
        ? exportDeclarations.push(childNode as ExportDeclaration)
        : this.getExportDeclarationsFromNode(childNode, exportDeclarations);
    });
    return exportDeclarations;
  };
  private static declarationsContainer(): declarationKinds {
    return {
      exports: [],
      imports: [],
      classes: [],
      variables: [],
      types: [],
      interfaces: [],
    };
  }
  private static declarationsMap(): declarationMaps {
    return {
      exports: new Map(),
      imports: new Map(),
      classes: new Map(),
      variables: new Map(),
      types: new Map(),
      interfaces: new Map(),
    };
  }
}
