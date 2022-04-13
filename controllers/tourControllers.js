const AppError = require('./../utils/appError');
const Tour = require('./../models/tourModels');
// const APIFeature = require('./../utils/apiFeature');
const factory = require('./factoryHandler');

const catchAsync = require('./../utils/catchAsync');

//////////////  MIDDLEWARE
// const catchAsync = fn => {
//   return (req, res, next) => {
//     // fn(req, res, next).catch(err => next(err));
//     fn(req, res, next).catch(next);
//   };
// };

exports.aliasTopTour = (req, res, next) => {
  req.query = {
    limit: 5,
    sort: '-ratingsAverage,price',
    fields: 'name,price,ratingsAverage,difficulty,summary'
  };
  next();
};

/////////////////////   ROUT HANDLER

//////////////////////////////////////////////////////////////////

// exports.getSingleTour = factory.getOne(Tour, {
//   path: 'reviews',
//   select: '-__v'
// });

exports.getSingleTour = catchAsync(async (req, res, next) => {
  // 1
  // const query = await Tour.findById(req.params.id);
  // 2
  // const query = await Tour.findById(req.params.id).populate('reviews');
  // 3
  const query = await Tour.findById(req.params.id)
    .populate('reviews')

    // .select('name');
    .select('-startLocation -images -startDates -locations');
  // if (popOptions) query = query.populate(popOptions);

  // const doc = await query;
  // // const tour = await Tour.findById(req.params.id).populate('guides');
  // const doc = await Tour.findById(req.params.id)
  //   .populate('reviews')
  //   .select('-__v');

  if (!query) {
    return next(new AppError(`can't ${req.originalUrl} on this server`, 400));
  }
  res.status(200).json({
    status: 'success',
    data: query
  });
});

exports.getAllTours = factory.getAll(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.createTour = factory.createOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

//    //////////////////////////////////  TODO:    AGGREGATION PIPELINE
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4 } }
    },
    // {
    //   $match: { difficulty: { $eq: '$EASY' } }
    // },

    {
      $group: {
        // _id: "$difficulty"
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        totalIncome: { $sum: '$price' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        duration: { $sum: '$duration' },
        name: { $push: '$slug' },
        secretTour: { $push: '$secretTour' }
      }
    },
    {
      $sort: { totalIncome: 1 }
      // $sort: { avgPrice: 1 }
    },
    // {
    //   $match: { secretTour: true }
    //   // $match: { $ratingsAverage: { $lte: 3 } }
    // },
    {
      // $match: { _id: { $ne: 'EASY' } }
      // $match: { _id: { $ne: 'EASY' } } ////  WE already defined | difficulty => (_id) , eq = EASY
      $match: { name: { $ne: 'the-city-wanderer' } } //////   ek element ki wjh se pura group ht jata h
    }
  ]);

  res.status(200).json({
    status: 'success',
    body: {
      tour: stats
    }
  });
});

exports.getBusyMonth = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  console.log(Tour.length);
  const stats = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-1-1 `), // ${year}/1/1  can also be writen
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        //////                           STAGE : $group, $addField, $project, $sort, $match
        _id: { $month: '$startDates' }, ////   FIELD : nTours, price, duration, difficulty
        nTours: { $sum: 1 },
        price: { $push: '$price' },
        duration: { $push: '$duration' },
        difficulty: { $push: '$difficulty' },
        tour: { $push: '$name' }
      }
      // $addFields: { month: '$_id' }   ///////-------- WE CAN'T PUT HERE-----------
    },
    {
      $addFields: { month: '$_id' } //// ADD EXTRA FIELD of month
    },
    {
      $project: {
        //      _id = 0
        _id: 0 ///////  IT WILL NOT SHOW THE (_id) in POSTMAN [0,1]
      }
    },
    {
      $sort: { nTours: -1 } ////////   it TAKE  FIELD [1,-1]
    },
    {
      $limit: Tour.length
      // $limit: 2 ///////////     only show 2 Elements
    }

    // {
    //   $group: {
    //     _id: { $month: '$startDates' },
    //     numTours: { $sum: 1 },
    //     // duration: { $push: '$duration' },
    //     difficult: { $push: '$difficulty' },
    //     name: { $push: '$name' }
    //   }
    // },
  ]);

  res.status(200).json({
    status: 'success',
    length: stats.length,
    body: {
      tour: stats
    }
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params; /// req.params is {(OBJECT)}
  const [lat, lng] = latlng.split(','); ///  latlng is {(ARRAY)} becasue of split , latlng is a {(STRING)}

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
