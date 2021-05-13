const path = require('path');
const PORT = process.env.PORT || 3000;
//if get an error, remove everything after shop below
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://noo19002:database12@cluster0.jvt7v.mongodb.net/shop?retryWrites=true&w=majority'

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');

const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    family: 4
};

const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});
const csrfProtection = csrf();

const corsOptions = {
    origin: "https://<your_app_name>.herokuapp.com/",
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));
// app.use(session({
//     seret: 'my secret', 
//     resave: false, 
//     saveUninitialized: false, 
//     store: store
//     })
// );

app.use(require('express-session')({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
}));

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
    if (!req.session.user) {
        return next();
    }
    User.findById(req.session.user._id)
        .then(user => {
            req.user = user;
            next();
        })
        .catch(err => console.log(err));
});

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose
    .connect(
        MONGODB_URI, options
    )
    .then(result => {
        app.listen(PORT);
    })
    .catch(err => {
        console.log(err);
    });