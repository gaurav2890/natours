// console.log(app.get("env"));
// console.log(process.env);
// console.log(process.env.NODE_ENV);
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(process.env.DATABASE_LOCAL, {
    ////////////////  if err=>  put "string" their instead of "path variable"
    // .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(con => {
    // console.log(con.connections);
    console.log('DB connection successfull');
  });

// const port = 8000;

app.listen(process.env.PORT, () => {
  console.log(`app running on  http://127.0.0.1:${process.env.PORT}`);
  console.log(`ENVIROMENT = ${process.env.NODE_ENV}`);
  console.log(`currnt directory ---> ${__dirname}`);
});
