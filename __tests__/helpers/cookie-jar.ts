/**
 * A stand-in for the Next.js cookie store, shared by the route tests: the
 * handlers read, set and delete the session cookie through `cookies()`, and
 * asserting on what they left behind is most of what those tests check.
 */
export type CookieRecord = {
  name: string;
  value: string;
  [option: string]: unknown;
};

function createCookieJar() {
  const records = new Map<string, CookieRecord>();

  return {
    records,
    reset() {
      records.clear();
    },
    store: {
      get(name: string): CookieRecord | undefined {
        return records.get(name);
      },
      set(record: CookieRecord) {
        records.set(record.name, record);
      },
      delete(name: string) {
        records.delete(name);
      },
    },
  };
}

// One instance per test file - Vitest gives each file its own module registry,
// so the mock factory and the test body see the same jar without leaking
// between files.
export const cookieJar = createCookieJar();
