import ts from 'typescript';
import { TsWrapperCache } from './WrapperCache.mjs';
import { log, loggerUtils } from '@typedox/logger';
import { TsWrapper } from './Wrapper.mjs';
import { isSymbol, tsItem } from './index.mjs';

export default {
	throw: {
		wrongType: (wrapper: TsWrapper, trace: string) => {
			log.throwError(
				log.identifier(wrapper),
				'Expected a Node or Symbol',
				trace,
			);
		},
		unsuccessful: (wrapper: TsWrapper, trace: string, tsItem: tsItem) => {
			const descriptor = isSymbol(tsItem)
				? tsItem.name
				: tsItem.getText && tsItem.getText();
			log.throwError(
				log.identifier(wrapper),
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
			log.throwError(log.identifier(this), `${message}:`, symbol.name);
		},
		noSymbol: function (node: ts.Node, fileName: string) {
			log.throwError(
				log.identifier(fileName),
				`Could not get a symbol from a node; ${loggerUtils.toLine(
					node.getText(),
					60,
				)}`,
				node.getSourceFile(),
				fileName,
			);
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
