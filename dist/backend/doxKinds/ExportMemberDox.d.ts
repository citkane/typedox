import { ExportSpecifier, Symbol, Type } from "typescript";
import Dox from "../Dox";
import DoxContext from "../DoxContext";
import { DoxKind } from "../types";
export default class ExportMemberDox extends Dox {
    private value;
    kind: DoxKind;
    name: string;
    alias: string;
    symbol: Symbol;
    constructor(context: DoxContext, value: ExportSpecifier | Symbol, type?: Type);
    private get isExportSpecifier();
    private static getSymbol;
    private static getNames;
}
