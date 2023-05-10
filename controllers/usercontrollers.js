const express = require('express');
const { ObjectId } = require("mongodb");
const router = express.Router();
const cartHelpers = require("../helpers/cartHelpers");
 const productHelpers = require('../helpers/productHelpers');
 const categoryHelpers = require("../helpers/categoryHelpers");
 
 const userHelpers = require('../helpers/userhelpers');
require('dotenv').config();
const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));

// Twilio-config
const accountSid =process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid=process.env.TWILIO_SERVICE_SID;
const client = require("twilio")(accountSid, authToken);

module.exports={

  userHome: (req, res) => {
    productHelpers.getProducts().then((products) => {
      res.render("index", { user: true, userName: req.session.userName, products });
    })
  },
    
    userLogin:(req,res)=>
    {
      if (req.session.userLoggedIn) {
        res.redirect("/");
      } else {
        const userName = req.session.userName;
        res.render("user/login", {user: true, userName, passErr: req.session.passErr,emailErr: req.session.emailErr});
        req.session.passErr = false;
        req.session.emailErr = false;
      }
        
      },
      userLoginPost:(req,res)=>
      {
        userHelpers.doLogin(req.body).then((response) => {
          if (response.status === "Invalid Password") {
            req.session.passErr = response.status;
            res.redirect("/login");
          } else if (response.status === "Invalid User") {
            req.session.emailErr = response.status;
            res.redirect("/login");
            
          }else if(response.status === "User Blocked!!!"){
              req.session.passErr = response.status;
              res.redirect("/login");
          }else {
            req.session.user = response.user;
            req.session.userName = req.session.user.name;
            req.session.userLoggedIn = true;
            res.render("index", {user: true, userName: req.session.userName});
          }
        }).catch((err) => {
          console.log(err);
        });
},

logout: (req, res) => {
  req.session.userLoggedIn = false;
  req.session.userName = false;
  res.redirect("/login");
},

usersignup:(req,res)=>
{
    res.render('user/signup',{user:true});
    req.session.emailExist = false;
},

signUpPost: (req, res) => {

  // Password check
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
  if (!passwordRegex.test(req.body.password)) {
    res.render("user/signup", {user: true,errMsg:"Password must contain 8 characters, uppercase, lowercase, number, and special(!@#$%^&*)"});
    return;
  }

  // Validate the mobile number using regular expressions
  const mobileRegex = /^[0-9]{10}$/;
  if (!mobileRegex.test(req.body.phone)) {
    res.render("user/signup", {user: true, errmsg: "Mobile number should be 10 digit number",});
    return;
  }

  // Redirect to otp page
  const phone = req.body.phone;
  client.verify.v2
    .services( serviceSid)
    .verifications.create({ to: "+91"+phone, channel: "sms" })
    .then(() => {
      req.session.userDetailes = req.body;
      res.redirect('/otpverification')
    }).catch((err) => console.log(err));
},


//Otp Page Render and Verfication
otpPageRender: (req, res) => {
  res.render('user/otpVerify', {user: true});
},

otpVerification: (req, res) => {
  const otp = req.body.otp;
  const phone = req.session.userDetailes.phone;
  console.log(req.body);
  client.verify
    .v2.services(serviceSid)
    .verificationChecks.create({ to: '+91'+phone, code: otp })
    .then((verification_check) => {
      if (verification_check.status === 'approved') {

        // If the OTP is approved,Call the userSignup method to create the user
        userHelpers.doSignUp(req.session.userDetailes).then((response) => {
          if (response == "Email already exist!!!") {
            req.session.emailExist = response;
            res.render("user/signup", {user: true, emailExist: req.session.emailExist});
          }else {
            res.redirect("/login");
          }
        })
        .catch((err) => {
          console.log(err);
        });
      } else {
        // If the OTP is not approved, render the OTP verification page with an error message
        res.render('user/otpVerify', { user:true, errMsg: 'Invalid OTP' });
      }
    })
    .catch((error) => {
      console.log(error);
      // Render the OTP verification page with an error message
      res.render('user/otpVerify', { user:true,  errMsg: 'Something went wrong. Please try again.' });
    });
},

productPage: (req, res) => {
  const productData = req.params.id;
  const userName = req.session.userName;
  
  productHelpers.getSingleProduct(productData)
  .then((product) => {
    res.render("user/productPages", { user: true, userName, product});
  })
  .catch((err) => {
    console.log(err);
  })
},
shopPage: async (req, res) => {
  const userName = req.session.userName;
  const sortedProducts = req.session.sortedProduct;
  console.log(
      sortedProducts + "sssssssssssssssssssssssssssssssssssssssssssss"
  );
  const categories = await productHelpers.getListedCategory();
  console.log("categories");

  if (sortedProducts) {
      console.log("insideSortedProducts");
      console.log(sortedProducts);
      console.log(categories);
      console.log(userName);
      res.render("user/shop", {
          user: true,
          categories,
          userName,
          sortedProducts,
      });

      req.session.sortedProduct = false;
  } else {
      console.log("insideNOrmalproduct");
      req.session.category = false;
      req.session.sortedProduct = false;
      req.session.maxPrice = false;
      req.session.minPrice = false;
      productHelpers
          .getProducts()
          .then((products) => {
              console.log("insideNOrmalproduct");
              res.render("user/shop", {
                  user: true,
                  categories,
                  userName,
                  products,
              });
          })
          .catch((err) => {
              console.log(err);
          });
    }
},
//user cart
cart: async (req, res) => {
  const userName = req.session.user.name;
  const userId = req.session.user._id;
  const userDetailes = await cartHelpers.getCart(userId);
    if(!userDetailes.length==0){
      await cartHelpers.getCartTotal(req.session.user._id).then((total)=>{
        res.render("user/cart", {user: true, userName, userDetailes, total:total});
      })
    }else{
      res.render('user/cart', {user: true, userName});
    }
},
cartPage: async (req, res) => {
  const productId = req.params.id;
  let quantity = 1;
  await cartHelpers.addToCart(productId, req.session.user._id, quantity);
    res.json({
      status:"success",
      message:"added to cart"
    })
},
deleteCart: (req, res) => {
  const userId = req.session.user._id;
  const productId = req.params.id;
  cartHelpers.deleteCart(productId, userId).then(()=> {
    res.redirect('back');
  })
},
// Product Quantity
changeProductQuantity:(req,res,next)=>{
  cartHelpers.changeProductQuantity(req.session.user._id, req.body)
  .then(async(response)=>{
    if(!response.removeProduct){
      response.total = await cartHelpers.getCartTotal(req.session.user._id)
      res.json(response)
    }else{
      res.json(response)
    }
  })
},
checkOutPage: async (req, res) => {
  const userName = req.session.user.name;
  const addresses = await userHelpers.getAddress(req.session.user._id);
  await cartHelpers.getCartTotal(req.session.user._id).then((total)=>{
  res.render("user/checkOut", { user: true, userName, addresses, total });
}).catch((err) => {
  console.log(err);
})
},
checkOutPost: (req, res) => {
  userHelpers.addAddress(req.body, req.session.user._id);
  res.redirect('back');
},
placeOrder:async(req,res)=>{
  const addressId=req.body.address
  const userDetails = req.session.user;
  console.log(userDetails+"user detailes");
  const total= await cartHelpers.getCartTotal(req.session.user._id);
  // console.log(total+"//////////////////////////"); 
  const paymentMethod=req.body.paymentMethod
  // console.log(`addressid : 324245 ${addressId}`);
  // console.log(`userID : 0987656789 ${req.session.user._id}`);
  const shippingAddress=await userHelpers.findAddress(addressId,req.session.user._id)
  const cartItems=await cartHelpers.getCart(req.session.user._id)
  const order={
    userId : new ObjectId(req.session.user._id),
    userName : req.session.userName,
    item:cartItems,
    shippingAddress:shippingAddress,
    total:total,
    paymentMethod:paymentMethod,
    products: cartItems,
    date:new Date().toISOString().slice(0, 19),
    status: "placed"
  }

  userHelpers.addOrderDetails(order)
  .then((order)=>{
    cartHelpers.deleteCartFull(req.session.user._id);

    if(req.body.paymentMethod === "COD"){
      res.json({
        status:true,
        paymentMethod: req.body.paymentMethod,
      });
    
    }else if (req.body.paymentMethod === "card"){
      const orderId = order.insertedId;
      // console.log(orderId,"order id annu mone");
      userHelpers.generateRazorpay(orderId, total).then((response) => {
        res.json({
          response: response,
          paymentMethod: "card",
          userDetails: userDetails
        });
      })
    }else{
      console.log("Error in cardPayment");
    }
  })
  .catch((err)=>{
    console.log(err);
  });

},

editAddressPost: (req, res) => {
  const address = req.params.id;
  userHelpers.editAddress(req.body, req.session.user._id, address);
  res.redirect('back')
},

deleteAddress:(req, res) => {
  const addressId = req.params.id;
  userHelpers.deleteAddress(addressId, req.session.user._id);
  res.redirect('back');
},
// Orders Page
orders:async (req, res) => {
  const userName = req.session.userName;
  const userId = req.session.user._id;
  const orders = await userHelpers.getOrders(userId);
  // console.log(JSON.stringify(orders)+"aaaaaaaaaaaaaaaaaaaaaaaaa");
  res.render('user/orders', {user: true, userName, orders});
},

cancelOrder:(req,res)=>{
  const orderId=req.params.id
  userHelpers.cancelOrder(orderId).then(()=>{
    res.redirect('back')
  })
},
viewDet: async(req, res) => {
  const userName = req.session.userName;
  const orderId = req.params.id;
  const orders = await userHelpers.getOrderedProducts(orderId);
  console.log(orders+"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  res.render('user/viewDet', {user: true, userName, orders})
},
// Category Filter
categoryFilter: async(req, res)=>{
  const userName = req.session.userName;
  const catName = req.params.name;
  req.session.category = catName;
  const categories = await productHelpers.getListedCategory();
  try{
    categoryHelpers.getSelectedCategory(catName)
    .then((products)=>{
      res.render("user/shop", { user: true, categories, userName, products});
    })
    .catch(()=>{
      res.redirect('/shop');
    })
  }catch(err){
    res.redirect('/shop');
  }
},

// User Profile
userProfile: async (req, res) => {
  const userName = req.session.userName;
  const address = await userHelpers.getAddress(req.session.user._id);
  // console.log(address+"wooooooooooooooooooooooooooooooow");
  res.render('user/userProfile', {user: true, userName, userDetailes:req.session.user, address});
},

userProfilePost: (req, res) => {
  const userId = req.session.user._id;
  userHelpers.editProfile(userId, req.body).then(() => {
    if(req.body.oldPassword.length > 1){
      userHelpers.editPassword(userId, req.body).then((response) => {
        if(response){
          req.session.changePassword = "";
          res.redirect('/userProfile')
        }else{
          req.session.changePassword = "Invalid old password";
          res.redirect('/userProfile')
        }
      })
    }else{
      req.session.changePassword = "";
      res.redirect('/userProfile')
    }
  })
},

manageAddress: async(req, res) => {
  const userName = req.session.userName;
  const addresses = await userHelpers.getAddress(req.session.user._id);
  res.render('user/manageAddress', {user: true, userName, addresses})
},


  //Wishlist
  wishlist: async (req, res) => {
    const userName = req.session.userName;
    const wishlist = await userHelpers.getWishlist(req.session.user._id);
    res.render('user/wishlist', {user: true, userName, wishlist})
  },

  // wishlistPage: (req, res) => {
  //   console.log("insidewishlist")
  //   const productId = req.params.id;
  //   userHelpers.addToWishlist(req.session.user._id, productId);
  //   res.json({
  //     status:"sccess",
  //     message:message
  //   })
  // },

  wishlistPage: async (req, res) => {
    const productId = req.params.id;
    const message = await userHelpers.addToWishlist(req.session.user._id, productId);
    res.json({
      status: "success",
      message: message
    });
  },

  deleteWishlist: (req, res) => {
    const userId = req.session.user._id;
    const productId = req.params.id;
    userHelpers.deleteWishlist(userId, productId);
    res.redirect("back");
  },
  verifyPayment : (req, res)=>{
    console.log(req.body+"verify payment");
    userHelpers.verifyPayment(req.body).then(()=>{
      userHelpers.changeOrderStatus(req.body.order.receipt).then(()=>{
        res.json({
          status: true
        });
      })
    })
  },
  //Price Sort Filter
  priceFilter: async (req, res) => {
    try {
      req.session.minPrice = req.body.minPrice;
      req.session.maxPrice = req.body.maxPrice;
      const category = req.session.category;
      req.session.filteredProduct = await productHelpers.filterPrice(req.session.minPrice,req.session.maxPrice,category);
      // console.log(req.session.filteredProduct+"asasasasssssssssssssssssss");
      res.json({
        status: "success",
      });
    } catch (err) {
      console.log(err);
    }
  },

  sortPrice: async (req, res) => {
    console.log("inside");
    req.session.minPrice = req.body.minPrice;
    req.session.maxPrice = req.body.maxPrice;
    const category = req.session.category;
    req.session.sortedProduct = await productHelpers.sortPrice(
        req.body,
        category
    );
  
    console.log('response details'+req.session.sortedProduct);
    res.json({
    
        status: "success",
    });
  },
  userSearchProduct: async (req, res) => {
    const userName = req.session.userName;
    console.log("weweweweew");
    const product = await productHelpers.userSearchProduct(req.body.name);
    console.log(product+"qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq");
    console.log("product");
    res.render("user/shop", { user: true, userName, product});
},
}