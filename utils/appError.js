class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    console.log('directory => ', __dirname);
    this.message = message;
    this.statusCode = statusCode;
    // this.status = `${statusCode}`.startsWith('4') ? 'fails' : 'error';
    this.status = 'FUCKED UP';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
    ////  capture the stack trace     console.log(err.stackTrace)
  }
}

module.exports = AppError;

// //  Agr try block k andr kuch bhi miss-match , ERROR  hota h to
// / try block ka kuch bhi action nhi krega console bhi print nhi krayega
// /seedhe catch block mn chla jayega     "script"
// const catchAsync = fn => {
//   return (req, res, next) => {
//     fn(req, res, next).catch(next);
//   };
// };

// exports.getAllTours = catchAsync(async (req, res, next) => {
//   const features = new APIFeature(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   const tours = await features.query;

//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours
//     }
//   });
// });

// exports.getAllTours = catchAsync(async (req, res) => {
//   // BUILD QUERY
//   const features = new APIFeature(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();

//   // EXECUTE QUERY
//   const tours = await features.query;

//   // SEND RESPONSE
//   res.status(200).json({
//     status: 'success',
//     results: tours.length,
//     data: {
//       tours
//     }
//   });
// });
