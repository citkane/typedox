#!/usr/bin/env node

import fs from 'fs';

const file = process.argv[2];

const packageBuffer = fs.readFileSync(file);
const packageObject = JSON.parse(packageBuffer.toString());

delete packageObject.scripts;
delete packageObject.devDependencies;
delete packageObject.workspaces;

const prunedPackage = JSON.stringify(packageObject, null, '\t');
fs.writeFileSync(file, prunedPackage);
