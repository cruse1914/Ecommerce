var express = require('express');
var router = express.Router();
var fs = require('fs');
// var session = require('express-session');

var Cart = require('../models/cart');
var products = JSON.parse(fs.readFileSync('./data/products.json', 'utf8'));


/* GET home page. */
router.get('/men1', function(req, res, next) {
  res.render('men1',  {products: products,});
});


router.get('/add/:id', function(req, res, next) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});
  var product = products.filter(function(item) {
    return item.id == productId;
  });
  cart.add(product[0], productId);
  req.session.cart = cart;
  res.redirect('/men1');
});

router.get('/cart1', function(req, res, next) {
  if (!req.session.cart) {
    return res.render('cart1', {
      products: null
    });
  }
  var cart = new Cart(req.session.cart);
  console.log("CART: "+ JSON.stringify(cart.getItems()))
  res.render('cart', {
    products: cart.getItems(),
    totalPrice: cart.totalPrice
  });
});

router.get('/remove/:id', function(req, res, next) {
  var productId = req.params.id;
  var cart = new Cart(req.session.cart ? req.session.cart : {});

  cart.remove(productId);
  req.session.cart = cart;
  res.redirect('/cart1');
});

module.exports = router;
