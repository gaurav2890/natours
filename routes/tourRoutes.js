const express = require('express');

////////////////////////////////////////    FIRST METHOD ////////////////

const tourController = require('./../controllers/tourControllers');
const authControllers = require('./../controllers/authControllers');
const reviewRouter = require('./reviewRoutes');

const tourRouter = express.Router(); //////////// ---> tourRouter is a router

// tourRouter.param("id", tourController.checkId); ////  PARAM middleware

// ///////////                           NESTED MIDDLEWARE         START            //////////////
// POST tours/24552552155/reviews
// GET tours/24552552155/reviews
// GET tours/24552552155/reviews/68351635463
//
// // 1)
// tourRouter
//   .route('/:tourId/reviews')
//   .post(
//     authControllers.protect,
//     authControllers.restrictTo('user'),
//     reviewControllers.createReview
//   );

//  2)

tourRouter.use('/:tourId/reviews', reviewRouter);

// ///////////                           NESTED MIDDLEWARE         END            //////////////

tourRouter
  .route('/top-5-cheap')
  .get(tourController.aliasTopTour, tourController.getAllTours);

tourRouter.route('/tour-stats').get(tourController.getTourStats);

tourRouter.route('/monthly-plan/:year').get(tourController.getBusyMonth);

////////////  GEOSPATIAL/////////////////////
tourRouter
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
tourRouter
  .route('/distances/:latlng/unit/:unit')
  .get(tourController.getDistances);
////////////  GEOSPATIAL //////////////////////

// ///  NOW tourRouter is  {{URL}}/api/v1/tours
tourRouter
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authControllers.protect,
    authControllers.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
// .post(tourController.checkBody, tourController.createTour); ///  CHAIN MIDDLEWARE

tourRouter.route(authControllers.restrictTo('admin', 'lead-guide'));

tourRouter
  .route('/:id')
  .get(tourController.getSingleTour)
  .patch(
    authControllers.protect,
    authControllers.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authControllers.protect,
    authControllers.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

///////////////////////////////////////     SECOND METHOD ///////////////////

// const {getAllTours, updateTour, deleteTour, createTour} = require("./../controllers/tourControllers")

// const tourRouter = express.Router(); //////////// ---> tourRouter is a router

// tourRouter.route("/").get(getAllTours).post(createTour);
// tourRouter
//   .route("/:id?")
//   .get(getSingleTour)
//   .patch(updateTour)
//   .delete(deleteTour);

module.exports = tourRouter;
