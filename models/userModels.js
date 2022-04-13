const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, `email is required`],
    minLength: [3, 'enter valid Name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, `email is required`],
    unique: true,
    trim: true,
    validate: [validator.isEmail, `Please enter a valid email`]
  },
  photo: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, `Password minimum length is 8`],
    minlength: 8,
    select: false
  },
  adminAccess: {
    type: String,
    passwords: this.password
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    },
    select: false
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpire: Date,
  active: {
    type: String,
    default: true,
    select: false ////  this affect on api , when api-query of find  , then this field shouldn't go
  }
});

userSchema.index({ price: 1, name: 1 });
//
//
//   // MONGOOSE MIDDLEWARE
//  only work on post and save requests  -- WHEN SOMETHING ENTER IN DATABASE

//  PRE HOOKS  password
//   HASH PASSWORD
userSchema.pre('save', async function(next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  console.log(this.password, ' 😍  this is password ');
  this.password = await bcrypt.hash(this.password, 12);
  // Delete passwordConfirm field
  this.passwordConfirm = undefined; //  this affect on DATABASE
  next();
});

userSchema.pre('save', function(next) {
  // // thia  = current document
  //   this.isModified --  iska mtlb jo documnet h  vo modified ho rha h
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^"find"/, function(next) {
  //   this.find ka mtlb h jb document find hoga
  this.find({ active: { $ne: true } });
  next();
});
// INSTANCES METHOD
//1 ///
///  bcrypt return promise   bcrypt.compare == automatically hash "candidate password "
//                                             and compare it with "user password"
////  JWT => create Token   &&    brcypt => encode token
userSchema.methods.checkPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//2  this method is for when user genrate token and then change the password
userSchema.methods.changedPasswordAfter = function(JWTTimeStamp) {
  //    JWTTIMESTAMP = when user signup , passwordchangedAt = when user login  and create token

  // // check Screeenshot of laptop in DEV FOLDER
  if (this.passwordChangedAt) {
    const changedPasswordAt = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(this.passwordChangedAt, changedPasswordAt, JWTTimeStamp);
    // console.log(this);  ///// this gives USER details

    return JWTTimeStamp < changedPasswordAt;
    /// IF changepaswordAt is gretaer  - means "this.passwordChangedAt "is modified
    ///      JWTTimeStamp is time  -- means  when user LOged in
    ///      JWTTimeStamp is always greater then " this.passwordChangedAt" untill it modified
  }

  // False means password NOT changed   and its default
  return false;
};

////  CRYPTO =>  create token &  hash Token
userSchema.methods.createPasswordResetToken = function() {
  // A) GEnerate token --   it takes nothing like  { JWT ( signToken - id , secret key , expiresIN)   in order to create token( While LOGIN)  to get Tours}
  const resetToken = crypto.randomBytes(32).toString('hex');
  // ///  secure this token   +> but NOT by "bcrypt" only by "crypto"

  // B) Encode Token - By crypto , Not by bcrypt
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
