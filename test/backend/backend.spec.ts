process.env.NODE_ENV = 'test';

import * as dox from '../../src/backend/typedox';
import main from '../../src/backend/typedox';

const defaultOptions = dox.config.getDefaultDoxOptions();
/*
const customOptions = {
	...defaultOptions,
	...{ projectRootDir: __dirname },
} as dox.projectOptions;

main(customOptions);
*/
