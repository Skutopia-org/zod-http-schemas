/** HTTP Methods */
export const methods = ['GET', 'POST'] as const;

/** HTTP Methods */
export type Method = typeof methods[number & keyof typeof methods];
