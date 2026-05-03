// The zod schemas (runtime validators) live in ./generated/api.
// ./generated/types contains TS interfaces with the SAME names — re-exporting
// both creates duplicate-export errors. Consumers needing the static types
// should import them from @workspace/api-client-react instead; this package's
// public surface is just the zod runtime validators.
export * from "./generated/api";
export * as types from "./generated/types";
