/** HTTP Methods */
export const methods = ['GET', 'POST', 'PUT'] as const;

/** HTTP Methods */
export type Method = typeof methods[number & keyof typeof methods];
