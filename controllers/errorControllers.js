const AppError = require('../utils/appError');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    nothing: 'justCheck',
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// ///   errors come when a user authenticate himself , FOr a secured Route
const handleJWTError = () =>
  new AppError('Invalid token , PLEASE try again later', 401);

const handleExpiredError = () =>
  new AppError('Token is Expired, TRy to login Again  ', 401);

// /////     ERRORS COME when routing with tours
const handleCastErrorDB = err => {
  const message = `👎 Invalid ${err.path}: ${err.value}.`;
  console.log(message);
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `👎 Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `👎 Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client  which errro is handled in our program
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });

    // Programming or other unknown error: don't leak error details , which ERorr is NOT handled by developer
  } else {
    // 1) Log error
    console.error('ERROR 💥', err);

    // 2) Send generic message
    res.status(508).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
};

// /////  4 ARGUMNETS  mean --  GLOBAL ERROR HANDLER ||  ERROR HANDLIG MIDDLEWARE
module.exports = (err, req, res, next) => {
  // console.log(err.stack);

  err.statusCode = err.statusCode || 508;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    console.log('error comes in GHM  development');
    console.log(err.message, '🧨DEVELOPMENT🚒🧯');
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    console.log('error comes in GHM  production');
    console.log(
      `NAME = ${err.name}, STATUS_CODE = ${err.statusCode}, STATUS = ${err.status}, '\n', MESSAGE = ${err.message}`
    );
    console.log('🎇PRODUCTION🔥');

    let error = err;

    if (error.name === 'CastError') error = handleCastErrorDB(error); /// INVALID  id
    if (error.code === 11000) error = handleDuplicateFieldsDB(error); /// DUPLICATE databse  when create new tour
    if (error.name === 'ValidationError')
      //// mistake in  updating a tour
      error = handleValidationErrorDB(error);

    // // IN AUTHENTICATION
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleExpiredError();

    //
    sendErrorProd(error, res);
  }
};

// // ///  GLOBAL ERROR HANDLER MIDDLEWARE
// app.use((err, req, res, next) => {
//   err.status = err.status || 'error';
//   err.statusCode = err.statusCode || 500;
//   console.log('error-> ', err.message);

//   res.status(err.statusCode).json({
//     status: err.status,
//     message: `GLOBAL ERROR HANDLER \n ${err.message}`
//   });
// });
