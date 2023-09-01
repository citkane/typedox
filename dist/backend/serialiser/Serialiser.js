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
exports.enumsGroup = exports.functionsGroup = exports.variablesGroup = exports.classesGroup = exports.nameSpacesGroup = exports.branch = exports.tsReference = exports.npmPackage = exports.project = void 0;
const dox = __importStar(require("../typedox"));
const log = dox.lib.Logger;
function project(root) {
    const packages = mapToObject(root.npmPackages, npmPackage);
    return {
        packages,
    };
}
exports.project = project;
function npmPackage(npmPackage) {
    const { version, name, tsReferences } = npmPackage;
    const references = mapToObject(tsReferences, tsReference);
    return {
        name,
        version,
        references,
    };
}
exports.npmPackage = npmPackage;
function tsReference(reference) {
    const branches = mapToObject(reference.treeBranches, branch);
    const branchName = reference.name;
    return Object.assign({}, branches[branchName]);
}
exports.tsReference = tsReference;
function branch(treeBranch) {
    const { nameSpaces, functions, variables, classes, enums } = treeBranch;
    return {
        namespaces: mapToObject(nameSpaces, nameSpacesGroup),
        classes: mapToObject(classes, classesGroup),
        functions: mapToObject(functions, functionsGroup),
        enums: mapToObject(enums, enumsGroup),
        variables: mapToObject(variables, variablesGroup),
    };
}
exports.branch = branch;
function nameSpacesGroup(nameSpace) {
    return Object.assign({}, branch(nameSpace));
}
exports.nameSpacesGroup = nameSpacesGroup;
function classesGroup() {
    return {};
}
exports.classesGroup = classesGroup;
function variablesGroup() {
    return {};
}
exports.variablesGroup = variablesGroup;
function functionsGroup() {
    return {};
}
exports.functionsGroup = functionsGroup;
function enumsGroup() {
    return {};
}
exports.enumsGroup = enumsGroup;
function mapToObject(sourceMap, targetFunction) {
    const sourceObject = Object.fromEntries(sourceMap);
    Object.keys(sourceObject).forEach((key) => {
        sourceObject[key] = targetFunction(sourceObject[key]);
    });
    return sourceObject;
}
//# sourceMappingURL=Serialiser.js.map