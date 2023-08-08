import { Program, TypeChecker } from "typescript";
import TypeDox from "./TypeDox";
export default class DoxExport extends TypeDox {
    constructor(checker: TypeChecker, program: Program);
}
