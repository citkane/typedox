import logger from '../packages/logger/test/runners/logger.spec.mjs';
import backend from '../packages/backend/test/runners/backend.spec.mjs';

describe('Running all TypeDox tests.', function () {
	logger();
	backend();
});
