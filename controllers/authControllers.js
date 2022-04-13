const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModels');
const AppError = require('./../utils/appError');
const sendmail = require('./../utils/email');

//////////////  MIDDLEWARE
const catchAsync = fn => {
  return (req, res, next) => {
    // fn(req, res, next).catch(err => next(err));
    fn(req, res, next).catch(next);
  };
};

const signToken = id => {
  ///// jwt.sign  doesn't return promise   , BUT 😀 jwt.verify take call back function
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
//   expiresIn: process.env.JWT_EXPIRES_IN
// });

const filterObj = (obj, ...fields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (fields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  user.password = undefined;
  //
  res.status(statusCode).json({
    status: 'success',
    token,
    user
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body);
  const newUser = await User.create({
    role: req.body.role,
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt
  });
  if ((!role, !name, !email, !password, !passwordConfirm, !passwordChangedAt)) {
    return next(new AppError('Please provide all details ', 400));
  }

  createSendToken(newUser, 200, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body; //// destructuring       2

  // 1) Check if email and password exist
  if (!email || !password)
    return next(new AppError('Please enter email and password', 400));

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password -__v');
  /// // api doesn't bring password from DATABASE because In USERSmodels WE SELECT IT FALSE

  // const correct = await user.checkPassword(password, user.password); /// it can create bug if
  //  //  ////  unable to get user  IT WILL BE SYNCHRONUS (user assign upper)  TO AVOID WE USE WHOLE STATEMENT DOWN

  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(new AppError('Incorrect User and Password', 401));
  }

  // const id = user._id;
  console.log('USER LOGIN 😉', user);

  // const token = signToken(user._id);
  // res.status(200).json({
  //   status: 'success',
  //   id,
  //   token,
  //   email
  // });
  createSendToken(user, 200, res);
  // req.user = user;
});

exports.byemail = catchAsync(async (req, res, next) => {
  console.log(req.body, '😀 BY EMAIL😀😀');
  const { email } = req.body;
  const user = await User.findOne({ email }).select('+password');

  // res.status(300).json({
  //   status: 'success',
  //   user
  // });
  createSendToken(user, 200, res);
});

///// ONLY login users can ACCESS  PArticular routes
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer') ///  iske aage h (!)  lgaa ke kaam nhi kr skte
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  console.log('P=>', token);

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) VERIFICATIOn OF TOKEN  which given by client  -- token made up of "id" & "JWT_SECRET"
  // (A)
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // (B)
  // const verify = promisify(jwt.verify);   ///// convert (jwt.verify)  in to a promise function
  // verify(token, process.env.JWT_SECRET)
  //   .then(decoded => console.log(decoded))
  //   .catch();

  console.log('😀 DECODED Token', decoded);
  // console.log(`DECODED: ${decoded}`); ///  ADVANCED js

  //  3) check IS client still exist in our DATABASE ??
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(new AppError('this user doesn;t exist Anymore', 401));

  // 4) Check if client changed password after the token was issued ,  iat: issuedAt
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  //  TODO: IF we want some varaible to use from outside of this protect =>  we can
  //  we can do it by putting in (req)  Object ,
  //  BECAUSE REQ only travel from one MIDDLEWARE to another MIDDLEWARE
  console.log('P=>', currentUser);
  req.user = currentUser;
  //  GRANT ACCESS OF PROTECTED ROUTE
  next();
});
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there

  try {
    let token;
    if (req.cookies.jwt) {
      token = req.cookies.jwt;

      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );

      if (!decoded) {
        return next();
      }

      //  3) check IS client still exist in our DATABASE ??
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }
      req.locals.user = currentUser;
      return next();
    }

    //  GRANT ACCESS OF PROTECTED ROUTE
  } catch (err) {
    console.log('=>>>>>>', err);
  }

  next();
});

//
//  MIDDLEWARE can't take "arguments" so here we return a function And_
//  in routes we call this 'restrictTo' function
exports.restrictTo = (...roles) => {
  // console.log(typeOf roles) =  Closure
  // // roles = ['admin', 'lead-guide']   &&   req.user is getting from previous MIDDLEWARE ".protect")
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You are not authorised to access this role'));
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //  1) check user is given ??
  console.log('AC', req.body);
  if (!req.body.email) return next(new AppError('PLEASE provide Email!!'));

  const user = await User.findOne(
    { email: req.body.email },
    {
      new: true,
      runValidators: true
    }
  );

  console.log('AC', user);
  if (!user) {
    return next(new AppError(` OOPS!! USER Doesn't get Found `, 401));
  }

  // 2) genrate Token for User

  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false }); /// 1) "hashedtoken" and "expiredTIme" of Token saved
  // //// 2)  after routing from reseting password  both are gone undefined

  // 3) Send token via email

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetpassword/${resetToken}`;
  // // PROTOCOL = http ,  host = your host ("8000"),
  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\n
            If you didn't forget your password, please ignore this email!`;

  try {
    await sendmail({
      email: user.email,
      subject: `your Password reset token (valid for 10 min)`,
      message
    });

    console.log('AC', resetToken);

    res.status(200).json({
      status: 'success',
      resetToken
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending Email! Please try again later',
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //  1) check the "user" based on token
  // const hashedCrypto = crypto.randomBytes(32).toString('hex');
  const hashedCrypto = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  console.log('req.params, rp, AC=>', req.params);
  const user = await User.findOne({
    passwordResetToken: hashedCrypto,
    passwordResetExpire: {
      $gt: Date.now()
    }
  });

  if (!user) {
    return next(new AppError('Invalid Token ', 400));
  }
  console.log('USER 😀 FROM TOKEN,rp, Ac', user);

  // 2) If token has not expired , and there is user, then SET THE PASSWORD

  // // MDIFING DOCUMENT
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpire = undefined;

  await user.save();

  // 3) Update changedPasswordAt property for the user

  //   UPDATED IN THE  SCHEMA MIDDLEWARE

  // 4) login the user again
  // const token = signToken(user._id);
  // //
  // res.status(200).json({
  //   status: 'success',
  //   token,
  //   data: user
  // });
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //  1) check the "user" based on token
  const { email, oldPassword, newPassword, newPasswordConfirm } = req.body;

  if ((!email || !oldPassword, !newPassword, !newPasswordConfirm))
    return next(new AppError('Please enter email and password', 400));

  const user = await User.findOne({ email }).select('+password');

  // // // 2 Does Email or password match  , Check posted PASSOWRD does match
  if (!user || !(await user.checkPassword(oldPassword, user.password))) {
    return next(new AppError(`INCORRECT Email or password `, 400));
  }

  console.log('up,AC', user);
  console.log('up,AC', email, oldPassword, newPassword, newPasswordConfirm);
  //  3) If so update passwprd

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();

  //   GET back the user LOGIN
  // res.status(200).json({
  //   status: 'success',
  //   message: `your new password get updated ${newPassword}`,
  //   user
  // });
  createSendToken(user, 200, res);
});

// exports.deleteUser = catchAsync(async (req, res, next) => {
//   const getByField = filterObj(req.body, 'id'); // give json , accept json
//   const user = await User.findByIdAndRemove(getByField.id);

//   if (!user) return next(new AppError('No user found with that ID', 404));

//   res.status(200).json({
//     status: 'success',
//     delete: 'USER DELETED'
//   });
// });
