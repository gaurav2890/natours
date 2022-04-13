class APIFeature {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    ////// 1A filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];

    excludedFields.forEach(el => {
      delete queryObj[el];
    });

    // 1B ADVANCED FILTERING  ==  OPERATOR

    let queryStr = JSON.stringify(queryObj); /// convert OBJECT => STRING
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    // console.log(JSON.parse(queryStr));

    console.log('Filtering Query =>', queryStr);

    this.query = this.query.find(JSON.parse(queryStr)); /// convert STRING => OBJECT

    return this; ///     this is entire object   WHICH IS MADE BY API_FEATURE
  }

  sort() {
    // 2   SORTING BY elements

    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
      // TODO: 1;
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  field() {
    //  3  FIELDS    //// we limit the field , so we get minimum request in order to decrease Bandwith
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields); /// select method is of mongoose = (Tour.find().select())
      // , which require only  String/  containing spacexsd
      // TODO: 2;
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paging() {
    //  paginations

    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100; ///  on each page how many documnet should there

    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit); ////   skip just remove the documnets before it
    //    and limit will tell how many document should be seen
    // TODO: 3;

    if (this.queryString.page) {
      const numTours = this.query.countDocuments();
      if (skip > numTours) throw new Error(`"page : ${page} not found"`);
    }
    return this;
  }
}

module.exports = APIFeature;
//

// let tours;

/////////////    1         /////    we can't use filter in this
// tours = await Tour.find();
/////////////    2
// tours = await Tour.find({      /////   this is better way -> automatically  take query by mongoose
//   duration: 5,
//   difficulty: "easy",
// });
/////////////    3
//   tours = await Tour.find()
//     .where("duration")
//     .equals(5)
//     .where("difficulty")
//     .equals("difficult");
// }
/////////////    4           /////    equal to 2
// tours = await Tour.find(req.query);
/////////////   /////////////////////////////////////////////////////////////////

////// 1A filtering
// const queryObj = { ...req.query };
// const excludedFields = ["page", "sort", "limit", "fields"];

// excludedFields.forEach((el) => {
//   delete queryObj[el];
// });

// // 1B ADVANCED FILTERING  ==  OPERATOR

// let queryStr = JSON.stringify(queryObj);
// queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
// // console.log(JSON.parse(queryStr));

// let query = Tour.find(JSON.parse(queryStr));

// /// 2   SORTING BY elements

// if (req.query.sort) {
//   const sortBy = req.query.sort.split(",").join(" ");
//   query = query.sort(sortBy);
//   TODO: 1;
// } else {
//   query = query.sort("-createdAt");
// }

// //  3  FILTERING
// if (req.query.fields) {
//   const fields = req.query.fields.split(",").join(" ");
//   query = query.select(fields);
//   TODO: 2;
// } else {
//   query = query.select("-__v");
// }

// //  paginations

// const page = req.query.page * 1 || 1;
// const limit = req.query.limit * 1 || 100; ///  on each page how many documnet should there

// const skip = (page - 1) * limit;
// query = query.skip(skip).limit(limit); ////   skip just remove the documnets before it
// //    and limit will tell how many document should be seen
// TODO: 3;

// if (req.query.page) {
//   const numTours = await Tour.countDocuments();
//   if (skip > numTours) throw new Error(`"page : ${page} not found"`);
// }

//  EXECUTE QUERY
// tours = await query;
