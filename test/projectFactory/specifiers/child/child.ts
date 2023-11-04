const childClause = 'foo';

export * from '../grandchild/grandchild';
export default childClause;
export const child = 'child';
export type childType = typeof child;
