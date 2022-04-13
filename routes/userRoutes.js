const express = require('express');
const userControllers = require('./../controllers/userControllers');
const authControllers = require('./../controllers/authControllers');
const tourRouter = require('./tourRoutes');
// const User = require('../models/userModels');

const userRouter = express.Router();
// userRouter.use(authControllers.protect);

userRouter.post('/signup', authControllers.signup);
userRouter.post('/login', authControllers.login);
// //  reset PASSWORD
userRouter.post('/forgotPassword', authControllers.forgotPassword);
userRouter.patch('/resetPassword/:token?', authControllers.resetPassword);

userRouter.use(authControllers.protect);

userRouter.post('/updatePassword', authControllers.updatePassword);
userRouter.get('/getMe', userControllers.getMe, userControllers.getUser);
userRouter.post('/updateme', userControllers.updateMe);
userRouter.delete('/deleteMe', userControllers.deleteMe);

// userRouter.delete(
//   '/deleteUser',
//   authControllers.protect,
//   authControllers.restrictTo('admin', 'lead-guide'),
//   authControllers.deleteUser
// );

userRouter.use(authControllers.restrictTo('admin', 'lead-guide'));

userRouter.post('/byemail', authControllers.byemail);

userRouter
  .route('/')
  .get(userControllers.getAllUsers)
  .post(userControllers.createUser);

userRouter
  // .route('/:id?')
  .route('/:id')
  .get(userControllers.getUser)
  .delete(userControllers.deleteUser)
  .patch(userControllers.updateUser);

module.exports = userRouter;
