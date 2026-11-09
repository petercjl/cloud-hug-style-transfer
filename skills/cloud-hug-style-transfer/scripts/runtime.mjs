// The copied layout module only requires this error helper, not an npm runtime.
export const fail = (code, message) => Object.assign(new Error(message), { code });
