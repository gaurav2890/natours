///// SCHEMA
const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModels'); ////////  Use only in Embeded (NOT IN REFRENCE)

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters']
      // validate: [validator.isAlpha, 'Tour name must only contain characters']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        /////   enum only for string
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult'
      }
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      // set: val => val.toFixed(1)
      set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now()
      // select: false,
    },
    startDates: [Date],
    secretTour: {
      //////////   SCHEMA OBJECT
      type: Boolean,
      default: false
    },
    startLocation: {
      ////////////////    EMBEDDED OBJECT
      //  GEOJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    ///////////  which come in embeded are in ARRAY
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String, ///////////  address is just ID
        description: String,
        day: Number
      }
    ],
    // 1)  IN EMBEDED => WE NEED TO ASSIGN (ARRAY ) for coming of an array = "AND SAVE IN TO DATABASE"
    // guides: Array/////////////   WHEN we EMBEDED
    //
    // 2) IN CHILD REFRENCE => WE DON"T NEED TO ASSIGN (ARRAY)  IT TAKE AAUTOMATICALLY = "AND SAVE IN TO DATABASE"
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }] ////  WHEN we REFRENCE
    // 3) IN PARENT REFRENCING => WE DON"T STORE ARRAY
    /////////
    // 4) IN VRTUAL PROPERTY => WE DEFINE EVERYTHING  in VIRTUAL MODELS
    //
    //  (hm lmbe-chode ARRAY se bchne ke liye hi PARENT refrencing ko use krte h )
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// //////  DEFINED VIRTUAL PROPERTIES
//  create 'reviews FIELD' in that => take refrence (REVIEW DATASET) -> (tour FIELD) -> select (_id)
//        and get that review which belong to this "id" along with it populating
//
// Virtual populate /////////////////
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});

///// INDEXES => in Field ko phle hi arrange kr leta h (DATABASE MN)
//  WHEN we find document via (APIfeatures) then it will find In { INDEXES } , ye pure documnet ko search nhi krta
//  Hence it IMPROVE performance
tourSchema.index({ price: 1, ratingsAverage: 1 });
tourSchema.index({ startLocation: '2dsphere' });
tourSchema.index({ slug: 1 });
//////////////////----------------------------- START -------------------------------///////////////////////

// /////////      these middleware only work when we "post", - not on "update"
// //// TODO:  MONGOOSE MIDDLEWARE-------

// 1 DOCUMENT MIDDLEWARE:
//  runs before .save() and .create()  functions  only in these two__MIDDLEWARE  | doesn't work in .insertMany() and any other
//   2 MIDDLEWARE
//  1
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  // slugify is a string which comes along with url
  next();
});

// 2
tourSchema.pre('save', function(next) {
  console.log('Will save document...');
  next();
});

// ///   3)
///  WE WILL USE THIS , WHEN WE HAVE TO EMBEDED DOCUMENT
//////////////////////////////////////////////////////////////////////////////////////////////4
// tourSchema.pre('save', async function(next) {
//   const guidesPromise = this.guides.map(async id => await User.findById(id));
//   this.guides = await Promise.all(guidesPromise);
//   next();
// });
//////////////////////////////////////////////////////////////////////////////////////////////

//2 QUERY MIDDLEWARE
//    DOCUMENT middleaware is ONly When we save SOmething NEw , BUT QUERY MIDDLEWARE is WHEN WE FIND SOMETHING  AND WORK ON IT
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } }); //   'this' is set to be current query on which function is doing
  this.start = Date.now();
  next();
});

/////////////   DATA MODELS  =>    REFRENCING
tourSchema.pre(/^find/, function(next) {
  // //  'this' is (object "DATA") which comes after query of (req.findById)
  this.populate({
    path: 'guides',
    select: '-__v -passwordResetToken -passwordResetExpire '
  });
  next();
});

tourSchema.post(/^find/, function(docs, next) {
  console.log(
    `Query took ${Date.now() - this.start} milliseconds!  [😊 query MIDDLEWARE]`
  );
  next();
});

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next) {
//   // this.pipeline().unshift({ $match: { secretTour: false } }); //  both correct
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log('PIPELINE =>', this.pipeline());
//   next();
// });

// ////////////----------------------------------  END  --------------------------////////////////////////

///// MODEL\
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
