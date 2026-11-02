export function notFound(_req, res) { res.status(404).json({ message: 'This page could not be found.' }); }
export function errorHandler(error, _req, res, _next) {
  if (error?.code === 11000) return res.status(409).json({ message: 'An account with those details already exists.' });
  if (error?.name === 'ValidationError') return res.status(400).json({ message: 'Please check the information and try again.' });
  console.error(error);
  res.status(error.status || 500).json({ message: error.status ? error.message : 'Something went wrong. Please try again.' });
}
