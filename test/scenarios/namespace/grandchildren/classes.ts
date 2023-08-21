export default class Bob {}
export class Mary extends Bob {}
export class Jane {}

const notExported = 'notExported';

export { notExported as isExported };
