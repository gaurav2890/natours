// //review , rating , createdat, ref To user , refer to Tour
const mongoose = require('mongoose');
const Tour = require('./tourModels');

/// IN CHILD REFRENCING =>
// ///  HMNE TOUR MN SIRF EK (GUIDE SCHEMA) KO USE KIYA THA jo ki (child REFRENCING) ko show krta h
//   ISKA MTLB EK MODEL =  USSE JUDE SBHI CHILD KA ARRAY ->(MULTIPLE) STORE KRKE RKHEGA VO SCHEMA
//
//   IN PARENT REFRENCING = KE ANDR SIRF (EK EK ID HI) STORE KRKE RKHEGA VO SCHEMA
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A tour must have a review']
    },
    rating: {
      type: Number,
      min: [1, 'minimum rating is 1'],
      max: [5, 'maximum rating is 5'],
      default: 2.5,
      // set: val => Math.round(val * 10) / 10
      set: val => val.toFixed(1)
    },
    createdAt: {
      type: Date,
      default: Date.now()
    },

    user: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user ']
      }
    ],
    tour: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour ']
      }
    ]
  },
  {
    toJson: { virtual: true },
    toObject: { virtual: true }
  }
);
//      REVIEW INDEXES   --------------  ALREADY ARRANGE IN DATABASE
reviewSchema.index({ rating: 1 });
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// //////////////////  MIDDLEWARE //////////////////////

reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

// /////// ///////////////////                🌠    STATIC mETHOD ///              🌠            //////////////////////////////////////
///   this Methd is call  when coming from Schema to model
//
///   this method can create only  on  MODEL, SCHEMA ❌ NOT ON DOCUMENT   ( on where we create it),
//  AND this method is only available on MODEL ❌ NOT ON DOCUMENTS  (on where we call it)
// & this method work on provided {MODEL}- (this.r.constructor - 124)
//
// /   We can put 'Review' instead of 'reviewSchema'
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  console.log('TOURID,RM=> ', tourId);
  const stats = await this.aggregate([
    ///  this === Review Model
    ////  here 'this' represent (Review) model give access to reviews COLLECTION
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        //// Database mn se jo | $match => (filter) hoke aayega
        // //, usme Jitni alag-alag, {tour} field hogi | unsb alg-alg field ka ek ek Obj bnado
        nRatingOfTours: { $sum: 1 },
        avgRatingOfTour: { $avg: '$rating' },
        rating: { $push: '$rating' },
        tours: { $push: '$review' }
      }
    }
  ]);
  console.log('STATS,RM=>', stats);

  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0].avgRatingOfTour,
    ratingsQuantity: stats[0].nRatingOfTours
  });
};
///////////////////////////////////////////////  🌠///////////////////////////////////////  🌠/////////////////////

// ///  IN MIDDLEWARE ('this') represent  (documents)

reviewSchema.post('save', async function() {
  ////  JSE HI UPR WALI LINE KO CALL KIYA,  VSE HI DOCUMENT SAVE HO CHUKA H | NEECHE KA CODE ,DATABASE MN SAVE HONE KE BAAD RUN HOGA
  console.log('ID ,RM', this.id);
  // console.log(this);    TODO:     ///  IN DOCUMENT MIDDLEWARE ("this") gives documents

  await this.constructor.calcAverageRatings(this.tour); //  this.constructor === Review Model , this === new created (Review) document
  //  WE ARE CALLING ( calcAverageRatings) function on a Review Model
});

//  QueryMidlware========================================================================================================
// findByIdAndUpdate
// findByIdAndDelete

reviewSchema.pre(/^findOneAnd/, async function(next) {
  // await this.constructor.calcAverageRatings(this.tour);  //////    THIS METHOD DOES'T WORK ON QUERY MIDDLEAWSRE
  // console.log(this);     TODO:    ///  IN QUERY MIDDLEWARE ("this") gives query
  // METHOD TO GO AROUND IT  IS :- _-  EXECUTE THAT QUERY
  //
  this.r = await this.findOne(); /// QUERY -> DOCUMENT ||  WE CREATE NEW PROPERTY OF (this) - this.r
  console.log('Review', this.r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function() {
  // await this.findOne()    // WE CAN't execute this query  in post (here) , because query already executed
  await this.r.constructor.calcAverageRatings(this.r.tour); ////////  BUT NOW , query becomw document , HENCE we GET access of (this.tour)
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
