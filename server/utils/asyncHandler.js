// asyncHandler.js — catches async errors and forwards to the error middleware
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);