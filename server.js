// Gerekli modüller ve middleware'lerin yüklenmesi
const expressLayouts = require('express-ejs-layouts');
const express = require('express');
const path = require('path');
const helmet = require('helmet');
var csurf = require('csurf');
const dotenv = require("dotenv").config();
const app = express();
const session = require('express-session');
const MongoStore = require('connect-mongo');
const locals = require('./middlewares/locals');
const bodyParser = require('body-parser');
const connectDB = require("./Data/databaseConnect");
const createDummyData = require("./Data/dummyData");
const routers = require("./routers/index");
const ErrorHandler = require("./middlewares/ErrorHandler");
const MetaTag = require('express-metatag');

app.use(expressLayouts);
app.use((req, res, next) => {
  res.locals.layout = 'layouts/main'; // Layout dosyanızın yolu
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(helmet());

// Session ayarları
app.use(session({
  secret: 'helloo world',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

app.use(locals);

// app.use(csurf());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'dist')));

app.use(routers);
app.use(ErrorHandler);
app.use((req, res, next) => {
  res.redirect('/404');
});


(async () => {
  await connectDB();
  // await createDummyData();
})();


// Sunucuyu başlatma
const port = process.env.port || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
