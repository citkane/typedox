#!/usr/bin/env node

import fs from 'fs';

const file = process.argv[2];
const isRoot = process.argv[3] && process.argv[3] === 'true';

const packageBuffer = fs.readFileSync(file);
const packageObject = JSON.parse(packageBuffer.toString());

delete packageObject.scripts;
delete packageObject.devDependencies;
delete packageObject.workspaces;

if (isRoot)
	packageObject.exports = {
		'.': './backend/src/typedox.mjs',
		'./logger': './logger/src/index.mjs',
	};

/*
	if (packageObject.exports)
		Object.keys(packageObject.exports).forEach((key) => {
			const val = packageObject.exports[key].replace('./dist/', './');
			packageObject.exports[key] = val;
		});
*/
const prunedPackage = JSON.stringify(packageObject, null, '\t');

fs.writeFileSync(file, prunedPackage);
