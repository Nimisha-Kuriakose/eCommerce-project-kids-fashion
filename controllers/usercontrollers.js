
const categoryHelpers = require("../helpers/categoryhelpers");
const productHelpers = require("../helpers/productHelpers");
const userHelpers = require("../helpers/userhelpers");
const cartHelpers = require("../helpers/cartHelpers");
const { ObjectId } = require("mongodb")
//const adminHelpers = require("../helpers/adminhelpers");
const { default: axios } = require("axios");
const { response } = require("../app");
const cloudinary = require('../utils/cloudinary');
const paypal = require('paypal-rest-sdk')
const objectId = require('mongodb-legacy').ObjectId;

// Twilio-config
require('dotenv').config();
// Twilio-config
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;
const client = require("twilio")(accountSid, authToken);
//Paypal-configuration
const paypal_client_id = "ATUisaKS3IOqvZKCy0CW8YTNoLsymFS1PSiO5tG9fpHSgxTSDuS1VbA7QWDwnFq-FbslFZt08WY4IZQx";
const paypal_client_secret = "EGq1-nhCh5iYI4cdQhJpgyn_AxYotVffeSWeJFy63wXstjCclLQKlYbM-hByoHsLlxSxfPw7VJ6t1OXg";


paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': paypal_client_id,
  'client_secret': paypal_client_secret
});


module.exports = {

  userHome: (req, res) => {
    productHelpers.getSomeProducts().then(async (products) => {
      const coupons = await userHelpers.getCoupon()
      coupons.forEach(coupon => {
        coupon.deactivate = coupon.status === 'Deactivated' ? true : false;
        coupon.expired = coupon.status === 'Expired' ? true : false;
      })
      const banner = await userHelpers.getActiveBanner()
      if(req.session.user){
       
        res.render("index", {
          user: true,
          userName: req.session.userName,
          products,
          banner,
          coupons,
          
        });}
        else{res.render("index", {
          user: true,
          userName: req.session.userName,
          products,
          banner,
          coupons      
        });}
    });
  },

  userLogin: (req, res) => {
    if (req.session.userLoggedIn) {
      res.redirect("/");
    } else {
      const userName = req.session.userName;
      res.render("user/login", { user: true, userName, passErr: req.session.passErr, emailErr: req.session.emailErr });
      req.session.passErr = false;
      req.session.emailErr = false;
    }

  },
  userLoginPost:async (req, res) => {
    const banner = await userHelpers.getActiveBanner();
    userHelpers.doLogin(req.body).then((response) => {
      if (response.status === "Invalid Password") {
        req.session.passErr = response.status;
        res.redirect("/login");
      } else if (response.status === "Invalid User") {
        req.session.emailErr = response.status;
        res.redirect("/login");

      } else if (response.status === "User Blocked!!!") {
        req.session.passErr = response.status;
        res.redirect("/login");
      } else {
        req.session.user = response.user;
        req.session.userName = req.session.user.name;
        req.session.userLoggedIn = true;
        
        res.render("index", { user: true, userName: req.session.userName,banner });
      }
    }).catch((err) => {
     
    });
  },

  logout: (req, res) => {
    req.session.userLoggedIn = false;
    req.session.userName = false;
    res.redirect("/login");
  },

  usersignup: (req, res) => {
    res.render('user/signup', { user: true });
    req.session.emailExist = false;
  },

  signUpPost: (req, res) => {

    // Password check
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
    if (!passwordRegex.test(req.body.password)) {
      res.render("user/signup", { user: true, errMsg: "Password must contain 8 characters, uppercase, lowercase, number, and special(!@#$%^&*)" });
      return;
    }

    // Validate the mobile number using regular expressions
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(req.body.phone)) {
      res.render("user/signup", { user: true, errmsg: "Mobile number should be 10 digit number", });
      return;
    }

    // Redirect to otp page
    const phone = req.body.phone;
    client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: "+91" + phone, channel: "sms" })
      .then(() => {
        req.session.userDetailes = req.body;
        res.redirect('/otpverification')
      }).catch((err) => console.log(err));
  },
  sms: (req, res) => {

    // Validate the mobile number using regular expressions
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(req.body.phone)) {
      res.render("user/signup", { user: true, errmsg: "Mobile number should be 10 digit number", });
      return;
    }

    // Redirect to otp page
    const phone = req.body.phone;
    client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: "+91" + phone, channel: "sms" })
      .then(() => {
        req.session.userDetailes = req.body;
        res.redirect('/otpverification')
      }).catch((err) => console.log(err));
  },

  //Otp Page Render and Verfication
  otpPageRender: (req, res) => {
    res.render('user/otpVerify', { user: true });
  },
  otpresend: (req, res) => {
    res.render('user/otpresend', { user: true });
  },


  forgotPassPageRender: (req, res) => {
    res.render('user/forgotPassOtp', { user: true });
  },
  forgotPassOtpVerificaion: (req, res) => {
    const userOtp = req.body.otp;
    const phone = req.session.phone;
    
    // otp verify
    client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: "+91" + phone, code: userOtp })
      .then((verification_check) => {
        if (verification_check.status === "approved") {
          
          userHelpers.forgotPassUpdatePass(req.session.userDetails)
            .then(() => {
              res.redirect('/login')
            })
            .catch((err) => {
              
            });
        } else {
          // If the OTP is not approved, render the OTP verification page with an error message
          res.render("user/forgotPassOtp", { errMsg: "Invalid OTP" });
        }
      })
      .catch((error) => {
        // Render the OTP verification page with an error message
        res.render("user/forgotPassOtp", {
          errMsg: "Something went wrong. Please try again.",
        });
      });
  },

  
  otpVerification: async (req, res) => {
    const otp = req.body.otp;
    const phone = req.session.userDetailes.phone;
    console.log(req.body);
    const banner = await userHelpers.getActiveBanner();
    const products = await productHelpers.getSomeProducts();
    const coupons = await userHelpers.getCoupon();

    client.verify
      .v2.services(serviceSid)
      .verificationChecks.create({ to: '+91' + phone, code: otp })
      .then((verification_check) => {
        if (verification_check.status === 'approved') {

          // If the OTP is approved,Call the userSignup method to create the user
          userHelpers.doSignUp(req.session.userDetailes).then((response) => {
            if (response == "Email already exist!!!") {
              req.session.emailExist = response;
              res.render("user/signup", { user: true, emailExist: req.session.emailExist });
            } else {

              req.session.user = response.user;
              req.session.userName = req.session.user.name;
              req.session.userLoggedIn = true;


              coupons.forEach((coupon) => {
                coupon.deactivate = coupon.status === "Deactivated";
                coupon.expired = coupon.status === "Expired";
              });
              
              res.redirect("/");
            }
          }).catch((err) => {
            console.log(err);
          });
        } else {
          // If the OTP is not approved, render the OTP verification page with an error message
          res.render('user/otpVerify', { user: true, errMsg: 'Invalid OTP' });
        }
      })
      .catch((error) => {
        console.log(error);
        // Render the OTP verification page with an error message
        res.render('user/otpVerify', { user: true, errMsg: 'Something went wrong. Please try again.' });
      });
  },
  productPage: async (req, res) => {
    const productData = req.params.id;
    const userName = req.session.userName;
  

    productHelpers
      .getSingleProduct(productData)
      .then(async (product) => {
        if (!product) {
          res.render("user/productNotFound", {
            user: true,
            userName,
          });
        } else {
          const getRelatedProduct = await productHelpers.getRelatedProducts(
            product.category
          );
          res.render("user/productPages", {
            user: true,
            userName,
            product,
            getRelatedProduct,
           
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  },
  //forgot password
  forgotPassword: (req, res) => {
    res.render('user/forgot', { user: true, loginError: req.session.loginError })
    req.session.loginError = false;
  },
  forgotPass: (req, res) => {
    if (req.session.userLoggedIn) {
      res.redirect("/");
    }
    else {
      const userName = req.session.userName;
      res.render("user/forgotPass", { user: true, userName, passErr: req.session.passErr, emailErr: req.session.emailErr });
      req.session.passErr = false;
      req.session.emailErr = false;
    }
  },

  forgotPasswordPost: (req, res) => {
    // Check if the password and rePassword fields match

    if (req.body.password !== req.body.confirmPass) {

      res.render("user/forgotPass", { errMsg: "Password does not match" });
      return;
    }


    delete req.body.confirmPass;

   


    // Validate the password using regular expressions
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;

    if (!passwordRegex.test(req.body.password)) {

      res.render("user/forgotPass", { user: true, errMsg: "Password must contain 8 characters, uppercase, lowercase, number, and special(!@#$%^&*)" });
      //res.render('index',{user:true,userName:true});
      return;
    }

    userHelpers.checkuserBlockExist(req.body.email).then((response) => {

      if (response.status == "No user Found") {
        res.render("user/signup", { errMsg: response.status });
      } else if (response.status == "User Blocked") {

        res.render("user/forgotPass", { user: true, errMsg: response.status });
      }
      else {
       
        client.verify.v2
          .services(serviceSid)
          .verifications.create({ to: "+91" + response.phone, channel: "sms" })
          .then(() => {
            req.session.phone = response.phone;
            req.session.userDetails = req.body;
            
            res.render("user/forgotPassOtp");
          }).catch((err) => console.log(err));

      }
    });
  },

  forgotPasswordVerify: (req, res) => {
    let otp = req.body.otp;
    let mobile = req.body.phone;

    try {
      client.verify.v2.services('VA562c6f240909b785243a99c3f59d1e55')
        .verificationChecks
        .create({ to: `+91${mobile}`, code: otp })
        .then(verification_check => {
          
          if (verification_check.valid) {
            req.session.userLoggedIn = true;
            res.render('user/setNewPassword', { user: true, mobile });
          } else {
            res.render('user/forgotPasswordVerify', { user: true, mobile, status: true });
          }
        })
    } catch (err) {
     
      res.render('user/forgotPasswordVerify', { user: true, mobile, status: true });
    }
  },

  setNewPassword: (req, res) => {
    userHelpers.setNewPassword(req.body).then(() => {
      res.redirect('/login');
    });
  },


  shopPage: async (req, res) => {
    const userName = req.session.userName;
    const filteredProducts = req.session.filteredProduct;
    const minPrice = req.session.minPrice;
    const maxPrice = req.session.maxPrice;
    const sortedProducts = req.session.sortedProduct;
    const categories = await productHelpers.getListedCategory();

    //pagination
    const totalPages = await productHelpers.totalPages();
    const currentPage = req.query.page || 1;

    if (filteredProducts) {
      res.render("user/shop", { user: true, categories, userName, filteredProducts, minPrice, maxPrice });
      req.session.filteredProduct = false;
    } else if (sortedProducts) {
      res.render("user/shop", { user: true, categories, userName, sortedProducts, minPrice, maxPrice });
      req.session.sortedProduct = false;
    } else {
      req.session.category = false;
      req.session.filteredProduct = false;
      req.session.sortedProduct = false;
      req.session.maxPrice = false;
      req.session.minPrice = false;
      productHelpers.getProducts(currentPage).then((products) => {
        
        res.render("user/shop", { user: true, categories, userName, products, currentPage, totalPages });
      })
        .catch((err) => {
          
        });
    }
  },
  //user cart
  cart: async (req, res) => {
    const userName = req.session.user.name;
    const userId = req.session.user._id;
    const userDetailes = await cartHelpers.getCart(userId);
    if (!userDetailes.length == 0) {
      await cartHelpers.getCartTotal(req.session.user._id).then((total) => {
        res.render("user/cart", { user: true, userName, userDetailes, total: total });
      })
    } else {
      res.render('user/cart', { user: true, userName });
    }
  },
  cartPage: async (req, res) => {
    const productId = req.params.id;
    let quantity = 1;
    await cartHelpers.addToCart(productId, req.session.user._id, quantity);
    res.json({
      status: "success",
      message: "added to cart"
    })
  },
  deleteCart: (req, res) => {
    const userId = req.session.user._id;
    const productId = req.params.id;
    cartHelpers.deleteCart(productId, userId).then(() => {
      res.redirect('back');
    })
  },
  // Product Quantity
  changeProductQuantity: (req, res, next) => {
    cartHelpers.changeProductQuantity(req.session.user._id, req.body)
      .then(async (response) => {
        if (!response.removeProduct) {
          response.total = await cartHelpers.getCartTotal(req.session.user._id)
          res.json(response)
        } else {
          res.json(response)
        }
      })
  },
  checkOutPage: async (req, res) => {
    const userName = req.session.user.name;
    const addresses = await userHelpers.getAddress(req.session.user._id);
    await cartHelpers.getCartTotal(req.session.user._id).then((total) => {
      res.render("user/checkOut", { user: true, userName, addresses, total });
    }).catch((err) => {
      
    })
  },
  checkOutPost: (req, res) => {
    userHelpers.addAddress(req.body, req.session.user._id);
    res.redirect('back');
  },
  placeOrder: async (req, res) => {
    try {
      const addressId = req.body.address;
      const userDetails = req.session.user;
      const total = Number(req.body.total)
      const paymentMethod = req.body.paymentMethod;
      const shippingAddress = await userHelpers.findAddress(addressId, req.session.user._id);
      const cartItems = await cartHelpers.getCart(req.session.user._id);
      const now = new Date();
      const status = req.body.paymentMethod === "COD" ? "placed" : "pending";
  
      // Order collection
      const order = {
        userId: new objectId(req.session.user._id),
        userName: req.session.userName,
        item: cartItems,
        shippingAddress: shippingAddress,
        total: total,
        paymentMethod: paymentMethod,
        products: cartItems,
        date: now,
        status,
        coupon: req.body.coupon,
      };
  
      const userId = req.session.user._id;
      userHelpers.addOrderDetails(order, userId).then((order) => {
        cartHelpers.deleteCartFull(req.session.user._id);
  
        if (req.body.paymentMethod === "COD") {
          res.json({
            status: true,
            paymentMethod: req.body.paymentMethod,
          });
  
        } else if (req.body.paymentMethod === "card") {
          const orderId = order.insertedId;
          userHelpers.generateRazorpay(orderId, total).then((response) => {
            res.json({
              response: response,
              paymentMethod: "card",
              userDetails: userDetails,
            });
          });
        } else {
          const exchangeRate = 0.013;
          const totalCost = (Number(req.body.total) * exchangeRate).toFixed(0);
          const create_payment_json = {
            intent: "sale",
            payer: {
              payment_method: "paypal",
            },
            redirect_urls: {
              return_url: "http://localhost:3000/success",
              cancel_url: "http://localhost:3000/cancel",
            },
            transactions: [
              {
                amount: {
                  currency: "USD",
                  total: `${totalCost}`,
                },
                description: "Marvelous Ware SHOPPING PLATFORM PAYPAL PAYMENT",
              },
            ],
          };
  
          paypal.payment.create(create_payment_json, function (error, payment) {
            if (error) {
              res.render('user/failure', { user: true, userName: req.session.userName });
            } else if (payment) {
              try {
                req.session.orderId = order.insertedId;
                userHelpers.changeOrderStatus(order.insertedId).then(() => { console.log("changed") }).catch(() => { });
              } catch (err) {
                // Handle error
              } finally {
                for (let i = 0; i < payment.links.length; i++) {
                  if (payment.links[i].rel === "approval_url") {
                    res.json({
                      approval_link: payment.links[i].href,
                      status: "success"
                    });
                  }
                }
              }
            }
          });
        }
      });
    } catch (err) {
      // Handle error
    }
  },
  
  

  editAddressPost: (req, res) => {
    const address = req.params.id;
    userHelpers.editAddress(req.body, req.session.user._id, address);
    res.redirect('back')
  },

  deleteAddress: (req, res) => {
    const addressId = req.params.id;
    userHelpers.deleteAddress(addressId, req.session.user._id);
    res.redirect('back');
  },
  // Orders Page
  orders: async (req, res) => {
    const userName = req.session.userName;
    const userId = req.session.user._id;
    const orders = await userHelpers.getOrders(userId);

    orders.forEach(order => {
      order.isCancelled = order.status === "Cancelled" ? true : false;
      order.isDelivered = order.status === "Delivered" ? true : false;
      order.isReturned = order.status === "Return" ? true : false;
      const newDate = new Date(order.date);
      const year = newDate.getFullYear();
      const month = newDate.getMonth() + 1;
      const day = newDate.getDate();
      const formattedDate = `${day < 10 ? '0' + day : day}-${month < 10 ? '0' + month : month}-${year}`;
      order.date = formattedDate;
    });
    res.render("user/orders", { user: true, userName, orders });
  },
  cancelOrder: (req, res) => {
    console.log("inside one cance;l")
    const orderId = req.params.id;
    const reason = req.body.reason;
    userHelpers.cancelOrder(orderId, reason).then(() => {
      res.redirect("back");
    });
  },
  retunOrder: (req, res) => {
    const orderId = req.params.id;
    const reason = req.body.reason;
   
    userHelpers.returnProduct(orderId, reason).then(() => {
      res.redirect('back');
    })
  },
  viewDet: async (req, res) => {
    const userName = req.session.userName;
    const orderId = req.params.id;
    const orders = await userHelpers.getOrderedProducts(orderId);
   
    res.render('user/viewDet', { user: true, userName, orders })
  },
  // Category Filter
  categoryFilter: async (req, res) => {
    const userName = req.session.userName;
    const catName = req.params.name;
    req.session.category = catName;

    // Get all categories
    const categories = await productHelpers.getListedCategory();

    try {
      categoryHelpers.getSelectedCategory(catName)
        .then((products) => {
          res.render("user/shop", { user: true, categories, userName, products, selectedCategory: catName });

        })
        .catch(() => {
          res.redirect('/shop');
        });
    } catch (err) {
      res.redirect('/shop');
    }
  },
 


  // User Profile
  userProfile: async (req, res) => {
    const userName = req.session.userName;
    const address = await userHelpers.getAddress(req.session.user._id);
   
    res.render('user/userProfile', { user: true, userName, userDetailes: req.session.user, address });
  },

  userProfilePost: (req, res) => {
    const userId = req.session.user._id;
    userHelpers.editProfile(userId, req.body).then(() => {
      if (req.body.oldPassword.length > 1) {
        userHelpers.editPassword(userId, req.body).then((response) => {
          if (response) {
            req.session.changePassword = "";
            res.redirect('/userProfile')
          } else {
            req.session.changePassword = "Invalid old password";
            res.redirect('/userProfile')
          }
        })
      } else {
        req.session.changePassword = "";
        res.redirect('/userProfile')
      }
    })
  },

  manageAddress: async (req, res) => {
    const userName = req.session.userName;
    const addresses = await userHelpers.getAddress(req.session.user._id);
    res.render('user/manageAddress', { user: true, userName, addresses })
  },


  //Wishlist
  wishlist: async (req, res) => {
    const userName = req.session.userName;
    const wishlist = await userHelpers.getWishlist(req.session.user._id);
    res.render('user/wishlist', { user: true, userName, wishlist })
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
  verifyPayment: (req, res) => {
   
    userHelpers.verifyPayment(req.body).then(() => {
      userHelpers.changeOrderStatus(req.body.order.receipt).then(() => {
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
      req.session.filteredProduct = await productHelpers.filterPrice(req.session.minPrice, req.session.maxPrice, category);
     
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

    console.log('response details' + req.session.sortedProduct);
    res.json({

      status: "success",
    });
  },
  userSearchProduct: async (req, res) => {
  const userName = req.session.userName;
  const searchName = req.body.name;

  try {
    const product = await productHelpers.userSearchProduct(searchName);

    res.render("user/shop", { user: true, userName, product });
  } catch (err) {
    // Handle error
  }
},

  // Paypal
  paypalSuccess: (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const execute_payment_json = {
      payer_id: payerId,
      transactions: [
        {
          amount: {
            currency: "USD",
            total: "25.00",
          },
        },
      ],
    };
    paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
      const userName = req.session.userName;
      if (error) {
        userHelpers.changeOrderPaymentStatus(req.session.orderId).then(() => {
          
          res.render('users/failure', { user: req.session.user, userName });
        }).catch(() => { });
      } else {
        res.render('user/success', { user: req.session.user, payerId, paymentId, userName });
      }
    }
    );
  },

  failure: (req, res) => {
    res.render('user/failure', { user: true, userName: req.session.userName });
  },
  couponApply: (req, res) => {
    const userId = req.session.user._id;
    userHelpers.couponApply(req.body.couponCode, userId).then((coupon) => {
      if (coupon) {
        if (coupon === 'couponExists') {
          res.json({
            status: "coupon is already used, try another coupon"
          })
        } else {
          res.json({
            status: "success",
            coupon: coupon
          })
        }
      } else {
        res.json({
          status: "coupon is not valid !!"
        })
      }
    });
  },
  invoicegenerator: (req, res) => {
    const userName = req.session.userName;
    userHelpers.getOrderedProducts(req.params.id).then((singleproduct) => {
      userHelpers.getSingleorder(req.params.id).then((order) => {
        res.render('user/invoice', { user: true, singleproduct, order, userName })
      })
    })

  },

  getWallet: async (req, res) => {
    try {
      const userId = req.session.user._id;
      const wallet = await userHelpers.getWallet(userId);
      res.render('user/wallet', { user: true, userName: req.session.userName, wallet: wallet });
    } catch (error) {
    
      res.render('error', { message: 'An error occurred', error: error });
    }
  },
  userStatus: async (req, res, next) => {
    if (req.session.user && req.session.user._id) {
      const id = req.session.user._id;
      const userProfile = await userHelpers.getUser(id).then((response) => {
        if (response.status == "No user Found") {
          res.render("user/signup", {
            user: true,
            errMsg: response.status,
          });
        } else if (response.status == false) {
          req.session.userLoggedIn = false;
          req.session.userName = false;
          res.render("user/login", {
            user: true,
            errMsg: "User Blocked",
          });
        } else {
          next();
        }
      });
    } else {
      res.render("user/login", {
        user: true,
        errMsg: "User not logged in",
      });
    }
  },
  
}