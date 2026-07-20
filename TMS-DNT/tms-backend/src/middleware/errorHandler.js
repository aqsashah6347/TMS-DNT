// Catches anything thrown/passed to next(err) in any controller so we
// never leak raw SQL errors to the frontend and never crash the server.
function errorHandler(err, req, res, next) {
  console.error("🔥", err);

  const status = err.status || 500;
  const message =
    status === 500 ? "Something went wrong on the server" : err.message;

  res.status(status).json({ message });
}

module.exports = errorHandler;
