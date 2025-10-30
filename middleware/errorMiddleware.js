// middleware/errorMiddleware.js
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Log error for debugging
  const statusCode = err.status || 500;
  const message = err.message || 'Something went wrong!';

  if (req.accepts('json')) {
    res.status(statusCode).json({ error: message });
  } else {
    res.status(statusCode).render('error', { message });
  }
};
