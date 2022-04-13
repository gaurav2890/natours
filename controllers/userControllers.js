const jwt = require('jsonwebtoken');
const User = require('./../models/userModels');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./factoryHandler');

//////////////  MIDDLEWARE

const signToken = id => {
  ///// jwt.sign  doesn't return promise   , BUT 😀 jwt.verify take call back function
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// give json , accept json
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const createSendToken = (user, statusCode, res, status = 'success') => {
  const token = signToken(user._id);
  //
  res.status(statusCode).json({
    status: 'success',
    token,
    user
  });
};

exports.createUser = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordCofirm: req.body.passwordCofirm
  });

  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN
  // });

  // res.status(200).json({
  //   status: 'success',
  //   token: 'token',
  //   data: newUser
  // });
  createSendToken(newUser._id, 201, res);
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) This route  for not update password
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route  for not update password', 400));
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  console.log('😀', updatedUser);
  //  2)
  createSendToken(updatedUser, 200, res);
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, { active: false });

  console.log(user);
  res.status(200).json({
    status: 'success',
    delete: 'USER DELETED'
  });
});

// ////  for Devloper and manager

exports.getAllUsers = factory.getAll(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
