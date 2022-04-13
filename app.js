const path = require('path');
const morgan = require('morgan');
const express = require('express');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorControllers');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// //  TEMPLATE ==> Views      in MVC
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); ////   View Setting
// // 1) GLOBAL MIDDLEWARES
// //  serving static files
app.use(express.static(path.join(__dirname, 'public')));

//   MIDDLEWARE FOR SECURITY
// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);
//
app.use(helmet());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(express.json({ limit: '10kb' })); /// Parses data from Body
app.use(cookieParser()); /// Parses data from Cookies

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

//   custom Middleware
// 1
app.use((req, res, next) => {
  // console.log(req.headers);
  console.log(
    `hello from the middleware 👋  (${Object(
      req.cookies
    )}) after Every hit to server `
  );
  // console.log(req.cookies);
  next();
});

// 2 ) routes
app.use('/', viewRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter); ///  "reviewRoter" mount upon this ("/api/v1/reviews") in MIDDLEWARE

app.all('*', (req, res, next) =>
  next(new AppError(`can't find ${req.originalUrl} on this server`, 400))
);

// // ///  GLOBAL ERROR HANDLER MIDDLEWARE (take 4 argumnets)
app.use(globalErrorHandler);
//   TODO:  we never call function in MIDDLEWARE  we just put there   EXPRESS call them

module.exports = app;
