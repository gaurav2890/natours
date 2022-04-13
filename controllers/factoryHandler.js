const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeature = require('./../utils/apiFeature');

const requestTime = new Date().toISOString();

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndRemove(req.params.id);
    if (!doc) {
      return next(new AppError(`Can't get this id ${req.params.id}`, 400));
    }
    res.status(301).json({
      status: 'deleted',
      data: doc
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body); /////////  it save automatically in DB

    console.log('FH', doc);
    res.status(200).json({
      status: 'success',
      body: {
        data: doc
      }
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    console.log('upd,FH', req.params, req.body);

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      /////////  it save automatically in DB
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      body: {
        data: doc
      }
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;
    // // const tour = await Tour.findById(req.params.id).populate('guides');
    // const doc = await Model.findById(req.params.id)
    //   .populate('reviews')
    //   .select('-__v');

    if (!doc) {
      return next(new AppError(`can't ${req.originalUrl} on this server`, 400));
    }
    res.status(200).json({
      status: 'success',
      data: doc
    });
  });

exports.getAll = Model =>
  catchAsync(async (req, res, next) => {
    //   BUILD QUERY
    console.log('😶 query in getAll "FH", =>', req.query);

    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    //
    // this.query       = ModelFeature.query      ===  Model.find()
    // this.queryString = ModelFeature.queryString === req.query
    //
    const ModelFeature = new APIFeature(Model.find(filter), req.query)
      .filter()
      .sort()
      .field()
      .paging();

    // const docs = await ModelFeature.query.select('-__v').explain();
    const docs = await ModelFeature.query.select('-secretTour  -__v');
    //  SEND RESPONSE
    res.status(200).json({
      status: 'sucess',
      requestAt: requestTime,
      total: docs.length,
      data: {
        docs
      }
    });
  });
