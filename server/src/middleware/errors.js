export function notFound(req, res) { res.status(404).json({ message: 'This page could not be found.', requestId: req.requestId }); }
export function errorHandler(error, req, res, _next) {
  if (res.headersSent) return;
  const status = Number(error?.status || error?.statusCode) || 500;
  const requestId = req.requestId;
  if (status >= 500) console.error(JSON.stringify({ level: 'error', event: 'request_failed', requestId, name: error?.name || 'Error', code: error?.code || 'INTERNAL_ERROR' }));
  if (error?.code === 11000) return res.status(409).json({ message: 'A record with those details already exists.', requestId });
  if (error?.name === 'ValidationError' || error?.name === 'CastError') return res.status(400).json({ message: 'Please check the information and try again.', requestId });
  const messages = { 400: 'Please check the request and try again.', 413: 'The request is too large.', 415: 'This file type is not supported.', 429: 'Too many requests. Please try again shortly.' };
  return res.status(status >= 400 && status < 600 ? status : 500).json({ message: status < 500 ? (messages[status] || 'The request could not be completed.') : 'Something went wrong. Please try again.', requestId });
}
