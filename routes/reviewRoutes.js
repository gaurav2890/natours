const express = require('express');
const reviewController = require('./../controllers/reviewControllers');
const authControllers = require('./../controllers/authControllers');

// const reviewRouter = express.Router();

const reviewRouter = express.Router({ mergeParams: true });
// reviewRouter = 'api/v1/reviews/:tourId/reviews'
reviewRouter.use(authControllers.protect);

reviewRouter
  .route('/')
  .get(reviewController.getAllReview)
  .post(
    authControllers.restrictTo('user', 'admin'),
    reviewController.getUserTourId,
    reviewController.createReview
  );

// reviewRouter.use(authControllers.restrictTo('admin', 'lead-guide'));

reviewRouter
  .route('/:id')
  .get(reviewController.getReview)
  .patch(authControllers.protect, reviewController.updateReview)
  .delete(authControllers.protect, reviewController.deleteReview);
module.exports = reviewRouter;
