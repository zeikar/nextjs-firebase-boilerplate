/**
 * Stands in for the `server-only` marker package, whose default export throws
 * on import. The real server build resolves it to an empty module via the
 * `react-server` export condition; tests do the same through an alias instead,
 * because turning that condition on globally would also resolve
 * `react-dom/client` to its React Server Components build and break every
 * client-side test.
 */
export {};
