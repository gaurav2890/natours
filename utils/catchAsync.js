module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// //////    AGR HM ISE USE KRTE H TO  ==   CONTROLLER FUNCTION MN HME =>  catchAsync.catchAsync()  use krna hoga
//
//  Qki  Hm is pure (catchAsync FOLDER) ko ek (catchAsync  variable)  mn store kr rhe h  FIR us variable mn se
//  hme (catchAsync controller )  ko choose krna hoga

//

//
// exports.catchAsync = fn => {
//   return (req, res, next) => {
//     fn(req, res, next).catch(next);
//   };
// };
