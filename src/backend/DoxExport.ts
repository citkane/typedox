import {
  ExportDeclaration,
  NamedExports,
  Program,
  SyntaxKind,
  TypeChecker,
  Node,
  StringLiteral,
  ExportSpecifier,
  NamespaceExport,
  SourceFile,
  ExportAssignment,
  ExpressionStatement,
  ModuleDeclaration,
  Identifier,
} from "typescript";
import TypeDox from "./TypeDox";
import * as path from "path";
import * as fs from "fs-extra";

export default class DoxExport extends TypeDox {
  exportDeclaration: Node;
  exportSources: SourceFile[];
  location: string[];
  constructor(
    checker: TypeChecker,
    program: Program,
    declaration: Node,
    location: string[]
  ) {
    super(checker, program);
    this.exportSources = [];
    this.location = location;
    this.exportDeclaration = declaration;
    this.exportDeclaration.forEachChild((child) => {
      this.parse(child);
      //console.log(SyntaxKind[child.kind]);
    });
  }
  parseExportDeclaration(
    exportDeclaration: ExportDeclaration,
    namespace = false
  ) {
    exportDeclaration.forEachChild((child) => this.parse(child));
  }
  parseNamedExports(namedExport: NamedExports, namespace = false) {
    namedExport.forEachChild((child) => this.parse(child));
  }
  parseExportSpecifier = (
    exportSpecifier: ExportSpecifier,
    namespace = false
  ) => {
    this.location.push(exportSpecifier.name.getText());
    return;
    console.table({
      propertyname: exportSpecifier.propertyName?.getText(),
      name: exportSpecifier.name.getText(),
    });
  };
  parseStringLiteral(stringLiteral: StringLiteral, namespace = false) {
    const fileParts = stringLiteral.text.split(".");
    const originalExtension = fileParts.pop();
    const fileExtension = originalExtension.endsWith("x") ? "tsx" : "ts";
    const fileName = `${fileParts.join(".")}`;
    const dirName = path.dirname(
      this.exportDeclaration.getSourceFile().fileName
    );
    let filePath = path.join(dirName, `${fileName}.${fileExtension}`);
    if (!fs.existsSync(filePath))
      filePath = path.join(dirName, `${fileName}.${originalExtension}`);

    //console.table({ dirName, fileName, filePath });

    const fileSource = this.program.getSourceFile(filePath);
    this.exportSources.push(fileSource);
  }
  parseNamespaceExport(namespaceExport: NamespaceExport, namespace = false) {
    namespaceExport.forEachChild((child) => this.parse(child, true));
  }
  parseExportAssignment(exportAssignment: ExportAssignment, namespace = false) {
    exportAssignment.forEachChild((child) => this.parse(child));
  }
  parseIdentifier(identifier: Identifier, namespace = false) {
    if (namespace) this.location.push(identifier.getText());
  }

  parse(node: Node, namespace = false) {
    const kindString = SyntaxKind[node.kind];
    //if (namespace) console.log(kindString, node.getText());
    const command = `parse${kindString}`;
    return this[command] ? this[command](node, namespace) : null; //console.log(kindString);
  }

  static nodesToSkip = [SyntaxKind.ImportDeclaration];

  /*
  parseExportDeclaration(node: Node) {
    node.forEachChild((child) => {
      switch (child.kind) {
        case SyntaxKind.NamedExports:
          const namedExport = child as NamedExports;
          this.parseExportDeclaration(namedExport);
          break;
        case SyntaxKind.ExportSpecifier:
          const exportSpecifier = child as ExportSpecifier;

          console.table({
            propertyname: exportSpecifier.propertyName?.getText(),
            name: exportSpecifier.name.getText(),
          });

          break;
        case SyntaxKind.StringLiteral:
          const stringLiteral = child as StringLiteral;
          const fileParts = stringLiteral.text.split(".");
          const originalExtension = fileParts.pop();
          const fileExtension = originalExtension.endsWith("x") ? "tsx" : "ts";
          const fileName = `${fileParts.join(".")}`;
          const dirName = path.dirname(node.getSourceFile().fileName);
          let filePath = path.join(dirName, `${fileName}.${fileExtension}`);
          if (!fs.existsSync(filePath))
            filePath = path.join(dirName, `${fileName}.${originalExtension}`);

          //console.table({ dirName, fileName, filePath });

          const fileSource = this.program.getSourceFile(filePath);
          //console.log(fileSource);
          break;
        case SyntaxKind.NamespaceExport:
          const nameSpaceExport = child as NamespaceExport;

          this.parseExportDeclaration(nameSpaceExport);
          break;
        default:
          console.log(SyntaxKind[child.kind], child.getText());
      }
    });
  }
  */
}
