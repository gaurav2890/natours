const Review = require('./../models/reviewModel');
// const catchAsync = require('./../utils/catchAsync');
const factory = require('./factoryHandler');

exports.getUserTourId = (req, res, next) => {
  console.log('getUserTourId RC =>', req.params.tourId, req.user.id);
  if (!req.body.tour) req.body.tour = req.params.tourId; ///  PARAMS COME BECAUSE OF ROUTE
  if (!req.body.user) req.body.user = req.user.id; ////  (req.user) come from PROTECT ROUTE
  console.log('Rc', req.user.id);
  next();
};

exports.getAllReview = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
