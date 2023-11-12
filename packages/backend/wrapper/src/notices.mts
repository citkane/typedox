import ts from 'typescript';
import { TsWrapperCache } from './WrapperCache.mjs';
import { log, loggerUtils } from '@typedox/logger';
import { TsWrapper } from './Wrapper.mjs';
import { isSymbol, tsItem } from './index.mjs';

export default {
	throw: {
		wrongType: function (this: TsWrapper, trace: string) {
			this.error = true;
			log.throwError(
				log.identifier(this),
				'Expected a Node or Symbol',
				trace,
			);
		},
		unsuccessful: function (
			this: TsWrapper,
			trace: string,
			tsItem: tsItem,
		) {
			this.error = true;
			const descriptor = isSymbol(tsItem)
				? tsItem.name
				: tsItem.getText && tsItem.getText();
			log.throwError(
				log.identifier(this),
				`Did not wrap a ${tsItem.constructor?.name}:`,
				descriptor,
				trace,
			);
		},
		wrapError: function (
			this: TsWrapper,
			symbol: ts.Symbol,
			message: string,
		) {
			this.error = true;
			log.throwError(log.identifier(this), `${message}:`, symbol.name);
		},
	},
	cacheSet: function (this: TsWrapperCache, key: string) {
		log.error(
			log.identifier(this),
			'Tried to set existing cache key:',
			key,
		);
	},
};
