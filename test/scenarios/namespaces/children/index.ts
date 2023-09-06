export * as grandchildren from '../grandchildren';
export module childModule {}
declare namespace childNameSpace {}
export { childNameSpace };

export * from '../grandchildren';

export class childClass {}
export const childConst = 'rootConst';
export function childFunction() {}
export const childArrowFunction = () => {};
export enum childEnum {}
