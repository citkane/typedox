#!/usr/bin/env node

const fs = require('fs');
const { spawn } = require('child_process');

!fs.existsSync('dist') && fs.mkdirSync('dist');
fs.cpSync('./src/bin', './dist/bin', {
	recursive: true,
});

const tsc = spawn('npx', ['tsc', ...process.argv.slice(2)]);

tsc.stdout.on('data', (data) => console.log(`${data}`));
tsc.stderr.on('data', (data) => console.error(`${data}`));
tsc.on('close', (code) =>
	console.log(`child process exited with code ${code}`.trim()),
);
