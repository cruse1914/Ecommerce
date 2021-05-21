require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

/*---- Add to cart ---*/
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const createError = require("http-errors");
//----------------------//
//--------------------//
const products1 = {
  "id": 1,
  "name": "Materia Magnetic Rust",
  "image": "s1.jpg",
  "price": 750
};

const products2 = {
  "id": 2,
  "name": "Atom Eternal 2.0 Black",
  "image": "s2.jpg",
  "price": 750
};
const products3 = {
  "id": 3,
  "name": "Atom Eternal 2.0 Blue",
  "image": "s3.webp",
  "price": 750
};
const products4 = {
  "id": 4,
  "name": "Atom Eternal 2.0 Grape",
  "image": "s4.webp",
  "price": 750
};
const products5 = {
  "id": 5,
  "name": "Materia Magnetic Dark Grey",
  "image": "s5.webp",
  "price": 750
};
const products6 = {
  "id": 6,
  "name": "Atom Dual Black",
  "image": "s6.webp",
  "price": 750
};
const products7 = {
  "id": 7,
  "name": "Atom Dual Blue",
  "image": "s7.webp",
  "price": 750
};
const products8 = {
  "id": 8,
  "name": "Atom Dual Grey",
  "image": "s8.webp",
  "price": 750
};

// -------------Subscribe--------------- //
const encrypt = require("mongoose-encryption");
const request = require("request");
const https = require("https");


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: process.env.SECRETS,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 24 hour
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/cruse1914db", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  line1: String,
  city: String,
  state: String,
  postal_code: Number,
  ph_num: Number,
  size: Number
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENTID,
    clientSecret: process.env.CLIENTSECRET,
    callbackURL: "https://radiant-cove-81516.herokuapp.com/auth/google/main1",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/main",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/main1");
  });

  // Global midleware
  app.use(function(req, res, next) {
    res.locals.session = req.session;
    next();
  });

app.get("/", function(req, res){
  res.render("main");
});
app.get("/main", function(req, res){
  res.render("main");
});
app.get("/about", function(req, res){
  res.render("about");
});
app.get("/men", function(req, res){
  res.render("men");
});
app.get("/women", function(req, res){
  res.render("women");
});
app.get("/outlet", function(req, res){
  res.render("outlet");
});
app.get("/contact", function(req, res){
  res.render("contact");
});
app.get("/login", function(req, res){
  res.render("login");
});
app.get("/register", function(req, res){
  res.render("register");
});
app.get("/cart", function(req, res){
  res.render("cart");
});

app.get("/main1", function(req, res){
    if (req.isAuthenticated()){
  res.render("main1");
} else {
  res.redirect("/login");
}
});
app.get("/about1", function(req, res){
    if (req.isAuthenticated()){
  res.render("about1");
} else {
  res.redirect("/login");
}
});

const fs = require('fs');
const products = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));

app.get("/men1", function(req, res){
    if (req.isAuthenticated()){
  res.render("men1",{
    products: products
  });
} else {
  res.redirect("/login");
}
});

app.get("/cart1", function(req, res){
    if (req.isAuthenticated()){
  User.find({"size": {$ne: null}}, function(err, usersize){
    if (!req.session.cart) {
      return res.render('cart1', {
        products: null
      });
      } else {
          if (usersize) {
    const cart = new Cart(req.session.cart);
    res.render('cart1', {
      products: cart.getItems(),
      totalPrice: cart.totalPrice,
      size: usersize
    });
  }
}
});
} else {
  res.redirect("/login");
}
});

const Cart = require('./models/cart');

app.get('/add/:id', function(req, res, next) {
  const productId = req.params.id;
  const cart = new Cart(req.session.cart ? req.session.cart : {});
  const product = products.filter(function(item) {
    return item.id == productId;
  });
  cart.add(product[0], productId);
  req.session.cart = cart;
  res.redirect('/men1');
});

app.get('/remove/:id', function(req, res, next) {
  const productId = req.params.id;
  const cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.remove(productId);
  req.session.cart = cart;
  res.redirect('/cart1');
});

app.get("/women1", function(req, res){
    if (req.isAuthenticated()){
  res.render("women1",{
    products: products
  });
} else {
  res.redirect("/login");
}
});
app.get("/outlet1", function(req, res){
    if (req.isAuthenticated()){
  res.render("outlet1");
} else {
  res.redirect("/login");
}
});
app.get("/contact1", function(req, res){
    if (req.isAuthenticated()){
  res.render("contact1");
} else {
  res.redirect("/login");
}
});
app.get("/choose", function(req, res){
    if (req.isAuthenticated()){
  res.render("choose");
} else {
  res.redirect("/login");
}
});
app.get("/ty", function(req, res){
    if (req.isAuthenticated()){
  const cart = new Cart(req.session.cart);
  res.render("ty",{  products: cart.getItems() });
} else {
  res.redirect("/login");
}
});
app.get("/success", function(req, res){
  res.render("success");
});
app.get("/failure", function(req, res){
  res.render("failure");
});
app.get("/myorder1",function(req,res){
  res.render("myorder1");
});
app.get("/myorder", function(req, res){
    if (req.isAuthenticated()){
  User.find({"size": {$ne: null}}, function(err, usersize){
User.findById(req.user.id, function(err, foundUsers){
  if (!req.session.cart) {
    return res.render('myorder', {
      products: null
    });
} else {
  if (usersize) {
      if (foundUsers) {
    const datetime = new Date();
  const cart = new Cart(req.session.cart);
  res.render("myorder",{
    products: cart.getItems(),
    totalPrice: cart.totalPrice,
    date: datetime.toDateString(),
    usersWithSecrets: foundUsers,
    size: usersize
  });
  }
    }
  }
});
});
} else {
  res.redirect("/login");
}
});

app.get("/1", function(req, res){
    if (req.isAuthenticated()){
  res.render("1",{  products1: products1});
} else {
  res.redirect("/login");
}
});
app.get("/12", function(req, res){
    if (req.isAuthenticated()){
  res.render("12",{  products1: products1});
} else {
  res.redirect("/login");
}
});
app.get("/13", function(req, res){
    if (req.isAuthenticated()){
  res.render("13",{  products1: products1});
} else {
  res.redirect("/login");
}
});
app.get("/14", function(req, res){
    if (req.isAuthenticated()){
  res.render("14",{  products1: products1});
} else {
  res.redirect("/login");
}
});
app.get("/2", function(req, res){
    if (req.isAuthenticated()){
  res.render("2",{  products2: products2});
} else {
  res.redirect("/login");
}
});
app.get("/22", function(req, res){
    if (req.isAuthenticated()){
  res.render("22",{  products2: products2});
} else {
  res.redirect("/login");
}
});
app.get("/23", function(req, res){
    if (req.isAuthenticated()){
  res.render("23",{  products2: products2});
} else {
  res.redirect("/login");
}
});
app.get("/24", function(req, res){
    if (req.isAuthenticated()){
  res.render("24",{  products2: products2});
} else {
  res.redirect("/login");
}
});
app.get("/3", function(req, res){
    if (req.isAuthenticated()){
  res.render("3",{  products3: products3});
} else {
  res.redirect("/login");
}
});
app.get("/32", function(req, res){
    if (req.isAuthenticated()){
  res.render("32",{  products3: products3});
} else {
  res.redirect("/login");
}
});
app.get("/33", function(req, res){
    if (req.isAuthenticated()){
  res.render("33",{  products3: products3});
} else {
  res.redirect("/login");
}
});
app.get("/34", function(req, res){
    if (req.isAuthenticated()){
  res.render("34",{  products3: products3});
} else {
  res.redirect("/login");
}
});
app.get("/4", function(req, res){
    if (req.isAuthenticated()){
  res.render("4",{  products4: products4});
} else {
  res.redirect("/login");
}
});
app.get("/42", function(req, res){
    if (req.isAuthenticated()){
  res.render("42",{  products4: products4});
} else {
  res.redirect("/login");
}
});
app.get("/43", function(req, res){
    if (req.isAuthenticated()){
  res.render("43",{  products4: products4});
} else {
  res.redirect("/login");
}
});
app.get("/44", function(req, res){
    if (req.isAuthenticated()){
  res.render("44",{  products4: products4});
} else {
  res.redirect("/login");
}
});
app.get("/5", function(req, res){
    if (req.isAuthenticated()){
  res.render("5",{  products5: products5});
} else {
  res.redirect("/login");
}
});
app.get("/52", function(req, res){
    if (req.isAuthenticated()){
  res.render("52",{  products5: products5});
} else {
  res.redirect("/login");
}
});
app.get("/53", function(req, res){
    if (req.isAuthenticated()){
  res.render("53",{  products5: products5});
} else {
  res.redirect("/login");
}
});
app.get("/54", function(req, res){
    if (req.isAuthenticated()){
  res.render("54",{  products5: products5});
} else {
  res.redirect("/login");
}
});
app.get("/6", function(req, res){
    if (req.isAuthenticated()){
  res.render("6",{  products6: products6});
} else {
  res.redirect("/login");
}
});
app.get("/62", function(req, res){
    if (req.isAuthenticated()){
  res.render("62",{  products6: products6});
} else {
  res.redirect("/login");
}
});
app.get("/63", function(req, res){
    if (req.isAuthenticated()){
  res.render("63",{  products6: products6});
} else {
  res.redirect("/login");
}
});
app.get("/64", function(req, res){
    if (req.isAuthenticated()){
  res.render("64",{  products6: products6});
} else {
  res.redirect("/login");
}
});
app.get("/7", function(req, res){
    if (req.isAuthenticated()){
  res.render("7",{  products7: products7});
} else {
  res.redirect("/login");
}
});
app.get("/72", function(req, res){
    if (req.isAuthenticated()){
  res.render("72",{  products7: products7});
} else {
  res.redirect("/login");
}
});
app.get("/73", function(req, res){
    if (req.isAuthenticated()){
  res.render("73",{  products7: products7});
} else {
  res.redirect("/login");
}
});
app.get("/74", function(req, res){
    if (req.isAuthenticated()){
  res.render("74",{  products7: products7});
} else {
  res.redirect("/login");
}
});
app.get("/8", function(req, res){
    if (req.isAuthenticated()){
  res.render("8",{  products8: products8});
} else {
  res.redirect("/login");
}
});
app.get("/82", function(req, res){
    if (req.isAuthenticated()){
  res.render("82",{  products8: products8});
} else {
  res.redirect("/login");
}
});
app.get("/83", function(req, res){
    if (req.isAuthenticated()){
  res.render("83",{  products8: products8});
} else {
  res.redirect("/login");
}
});
app.get("/84", function(req, res){
    if (req.isAuthenticated()){
  res.render("84",{  products8: products8});
} else {
  res.redirect("/login");
}
});



app.get("/s1", function(req, res){
  res.render("s1");
});
app.get("/s12", function(req, res){
  res.render("s12");
});
app.get("/s13", function(req, res){
  res.render("s13");
});
app.get("/14", function(req, res){
  res.render("s14");
});
app.get("/s2", function(req, res){
  res.render("s2");
});
app.get("/s22", function(req, res){
  res.render("s22");
});
app.get("/s23", function(req, res){
  res.render("s23");
});
app.get("/s24", function(req, res){
  res.render("s24");
});
app.get("/s3", function(req, res){
  res.render("s3");
});
app.get("/s32", function(req, res){
  res.render("s32");
});
app.get("/s33", function(req, res){
  res.render("s33");
});
app.get("/s34", function(req, res){
  res.render("s34");
});
app.get("/s4", function(req, res){
  res.render("s4");
});
app.get("/s42", function(req, res){
  res.render("s42");
});
app.get("/s43", function(req, res){
  res.render("s43");
});
app.get("/s44", function(req, res){
  res.render("s44");
});
app.get("/s5", function(req, res){
  res.render("s5");
});
app.get("/s52", function(req, res){
  res.render("s52");
});
app.get("/s53", function(req, res){
  res.render("s53");
});
app.get("/s54", function(req, res){
  res.render("s54");
});
app.get("/s6", function(req, res){
  res.render("s6");
});
app.get("/s62", function(req, res){
  res.render("s62");
});
app.get("/s63", function(req, res){
  res.render("s63");
});
app.get("/s64", function(req, res){
  res.render("s64");
});
app.get("/s7", function(req, res){
  res.render("s7");
});
app.get("/s72", function(req, res){
  res.render("s72");
});
app.get("/s73", function(req, res){
  res.render("s73");
});
app.get("/s74", function(req, res){
  res.render("s74");
});
app.get("/s8", function(req, res){
  res.render("s8");
});
app.get("/s82", function(req, res){
  res.render("s82");
});
app.get("/s83", function(req, res){
  res.render("s83");
});
app.get("/s84", function(req, res){
  res.render("s84");
});
app.post('/size', function (req, res) {
    const size1 = req.body.size;

    User.findOne(req.param.size, function(err, usersize){
      if (err) {
      } else {
        if (usersize) {
          usersize.size = size1;
          usersize.save(function(){
            res.redirect("1");
          });
        }
      }
    });
});
app.post('/size1', function (req, res) {
    const size2 = req.body.size1;

    User.findOne(req.param.size1, function(err, usersize){
      if (err) {
      } else {
        if (usersize) {
          usersize.size1 = size2;
          usersize.save(function(){
            res.redirect("2");
          });
        }
      }
    });
});
app.post('/size2', function (req, res) {
    const size3 = req.body.size2;

    User.findOne(req.param.size2, function(err, usersize){
      if (err) {
      } else {
        if (usersize) {
          usersize.size = size3;
          usersize.save(function(){
            res.redirect("3");
          });
        }
      }
    });
});
app.post('/size3', function (req, res) {
    const size4 = req.body.size3;

    User.findOne(req.param.size3, function(err, usersize){
      if (err) {
      } else {
        if (usersize) {
          usersize.size = size4;
          usersize.save(function(){
            res.redirect("4");
          });
        }
      }
    });
});
app.post('/size4', function (req, res) {
    const size5 = req.body.size4;

    User.findOne(req.param.size4, function(err, usersize){
      if (err) {
      } else {
        if (usersize) {
          usersize.size = size5;
          usersize.save(function(){
            res.redirect("5");
          });
        }
      }
    });
});
app.post('/size5', function (req, res) {
    const size6 = req.body.size5;

    User.findOne(req.param.size5, function(err, usersize){
      if (err) {
      } else {
        if (usersize) {
          usersize.size = size6;
          usersize.save(function(){
            res.redirect("6");
          });
        }
      }
    });
});
app.post('/size6', function (req, res) {
    const size7 = req.body.size6;

    User.findOne(req.param.size6, function(err, usersize){
      if (err) {
      } else {
        if (usersize) {
          usersize.size = size7;
          usersize.save(function(){
            res.redirect("7");
          });
        }
      }
    });
});
app.post('/size7', function (req, res) {
    const size8 = req.body.size7;

    User.findOne(req.param.size7, function(err, usersize){
      if (err) {
      } else {
        if (usersize) {
          usersize.size = size8;
          usersize.save(function(){
            res.redirect("8");
          });
        }
      }
    });
});

app.get("/address", function(req, res){
  if (req.isAuthenticated()){
  User.findById(req.user.id, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("address", {usersWithSecrets: foundUsers});
      }
    }
  });
} else {
  res.redirect("/login");
}
});


app.get("/submit", function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req, res){
  const street = req.body.line1;
const city1 = req.body.city;
const state1 = req.body.state;
const postal_code1 = req.body.postal_code;
const ph_num1 = req.body.ph_num;

  User.findById(req.user.id, function(err, foundUser){
    if (err) {
    } else {
      if (foundUser) {
        foundUser.line1 = street;
        foundUser.city = city1;
        foundUser.state = state1;
        foundUser.postal_code = postal_code1;
        foundUser.ph_num = ph_num1;
        foundUser.save(function(){
          res.redirect("/address");
        });
      }
    }
  });
});

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

app.post("/register", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/main1");
      });
    }
  });

});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/main1");
      });
    }
  });

});



//Subscribe //
app.post("/s", function(req, res){

  const email = req.body.email;

  const data ={
  members: [
    {
      email_address: email,
      status: "subscribed",
    }
  ]
};
const jsonData = JSON.stringify(data);
const url = "https://us2.api.mailchimp.com/3.0/lists/process.env.APIKEY";
const options = {
  method: "POST",
  auth: process.env.AUTH
}

const request = https.request(url, options, function(response){

  if (response.statusCode === 200) {
    res.render("success");
  }else {
  res.render("failure");
  }

  response.on("data", function(data){
  })
})

request.write(jsonData);
request.end();
});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port Successfully !");
});

// Stripe//
const Publishable_Key = process.env.PUBLISHABLEKEY;
const Secret_Key = process.env.SECRETKEY;

const stripe = require('stripe')(Secret_Key);
// const port = process.env.PORT || 3000


app.get('/checkout', function(req, res){
  const cart = new Cart(req.session.cart);
  res.render('checkout', {
	key: Publishable_Key,
  products: cart.getItems(),
  totalPrice: cart.totalPrice,
  name: req.body.name
});
});

app.post('/payment', function(req, res){

  const cart = new Cart(req.session.cart);
  const totalPrice = cart.totalPrice * 100;



  User.find({"postal_code": {$ne: null}}, function(err, foundUsers){
    if (err){
    } else {
      if (foundUsers) {
	stripe.customers.create({
		email: req.body.stripeEmail,
		source: req.body.stripeToken,
		name: req.body.name,
		address: {
			line1: foundUsers.line1,
			postal_code: foundUsers.postal_code,
			city: foundUsers.city,
			state: foundUsers.state,
			country: 'India',
		}
	}).then((customer) => {

		return stripe.charges.create({
			amount: totalPrice,	 // Charing Rs 25
			description: `Shoe's Order ID : ${JSON.stringify(cart.getItems())} `,
			currency: 'INR',
			customer: customer.id
		});
	}).then((charge) => {
		res.render("ty",{  products: cart.getItems() }); // If no error occurs
	})
	.catch((err) => {
		res.send(err)	 // If some error occurs
	});
}
}
});
});
module.exports = app;
