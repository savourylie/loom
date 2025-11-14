const perf =
  typeof globalThis !== "undefined" && globalThis.performance
    ? globalThis.performance
    : {
        now: () => Date.now(),
      };

export const performance = perf;
