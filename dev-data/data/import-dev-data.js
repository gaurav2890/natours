const fs = require('fs');
const mongoose = require('mongoose');
// var mongoose = require('./mongoconnection');
const dotenv = require('dotenv');
// const Tour = require('./../../models/tourModels');
const User = require('./../../models/userModels');
const Tour = require('./../../models/tourModels');
const Review = require('./../../models/reviewModel');
// const OldUser = require('./../../models/oldTour');

dotenv.config({ path: './config.env' });

// const DB = process.env.DATABASE.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD
// );

mongoose
  // .connect(process.env.DATABASE_LOCAL, {
  .connect('mongodb://localhost:27017/natours', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => console.log('DB connection successful!'))
  .catch(err => 'my bad');

// READ JSON FILE
// const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// IMPORT DATA INTO DB

const importData = async () => {
  try {
    // await Tour.create(tours);
    await User.create(users, { validateBeforeSave: true });
    // await Review.create(reviews);

    // console.log(tours);
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err.message);
  }
  process.exit();
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    // await Tour.deleteMany();
    await User.deleteMany();
    // await Review.deleteMany()
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err.message);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

// importData();
console.log(process.argv);
