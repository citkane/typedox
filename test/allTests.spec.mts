import loggerTest from '@typedox/test/logger';
import wrapperTest from '@typedox/test/wrapper';
import coreTest from '@typedox/test/core';
import serialiserTest from '@typedox/test/serialiser';
import e2eTest from './e2e.spec.mjs';

loggerTest();
wrapperTest();
coreTest();
serialiserTest();
e2eTest();
