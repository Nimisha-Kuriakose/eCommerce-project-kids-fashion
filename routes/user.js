var express = require('express');
var router = express.Router();
const userControllers = require('../controllers/usercontrollers');
const verifySession = require('../middleware/verifySession');



router.get('/',userControllers.userHome)
router.get('/login', userControllers.userLogin);
router.post('/Home', userControllers.userLoginPost);
router.get('/signup',verifySession.ifUserLoggedIn, userControllers.usersignup);
router.post('/signUp',userControllers.signUpPost);
router.get('/logout',verifySession.verifyUserLoggedIn, userControllers.logout);
 
// otp
router.get('/otpverification',verifySession.ifUserLoggedIn, userControllers.otpPageRender);
router.get('/resend',verifySession.ifUserLoggedIn, userControllers.otpresend);
router.post('/smssend', userControllers.usersignup);
router.post('/otpverification', userControllers.otpVerification);
// user cart
router.get('/cart/',userControllers.userStatus,verifySession.verifyUserLoggedIn, userControllers.cart);
router.post('/change-product-quantity', verifySession.verifyUserLoggedIn, userControllers.changeProductQuantity);
router.get('/addToCart/:id',userControllers.userStatus, verifySession.verifyUserLoggedIn, userControllers.cartPage);
router.get('/deleteCart/:id', verifySession.verifyUserLoggedIn, userControllers.deleteCart);
//forgot password
router.get('/forgotPass',userControllers.forgotPass)

router.post('/forgotPasswordPost', userControllers.forgotPasswordPost);


router.post('/forgotPassOTP',userControllers.forgotPassOtpVerificaion)
router.post('/forgotPassOtpVerificaion',verifySession.ifUserLoggedIn,userControllers.forgotPassOtpVerificaion)



// User Panel
 router.get('/shop',userControllers.userStatus,verifySession.verifyUserLoggedIn, userControllers.shopPage);

router.get('/product/:id',userControllers.userStatus,verifySession.verifyUserLoggedIn, userControllers.productPage);

router.get('/checkOut',userControllers.userStatus,verifySession.verifyUserLoggedIn, userControllers.checkOutPage);

router.post('/checkOutPost', verifySession.verifyUserLoggedIn, userControllers.checkOutPost);

router.post('/editAddressPost/:id', verifySession.verifyUserLoggedIn, userControllers.editAddressPost);

router.get('/deleteAddress/:id' , verifySession.verifyUserLoggedIn, userControllers.deleteAddress);
router.post('/placeOrder', verifySession.verifyUserLoggedIn, userControllers.placeOrder);

router.post('/verifyPayment', verifySession.verifyUserLoggedIn, userControllers.verifyPayment);

//Category
router.get('/category/:name',userControllers.userStatus, verifySession.verifyUserLoggedIn, userControllers.categoryFilter);

// User Orders
router.get('/orders', verifySession.verifyUserLoggedIn, userControllers.orders);
router.post('/cancelOrder/:id', verifySession.verifyUserLoggedIn, userControllers.cancelOrder);
router.post('/returnOrder/:id', verifySession.verifyUserLoggedIn, userControllers.retunOrder);
router.get('/orders/viewProduct/:id', verifySession.verifyUserLoggedIn, userControllers.viewDet);

//UserProfile
router.get('/userProfile', verifySession.verifyUserLoggedIn, userControllers.userProfile);

router.post('/userProfilePost', verifySession.verifyUserLoggedIn, userControllers.userProfilePost);

router.get('/userManageAddress', verifySession.verifyUserLoggedIn, userControllers.manageAddress);

//Wishlist
router.get('/wishlist', verifySession.verifyUserLoggedIn, userControllers.wishlist);

router.get('/addToWishlist/:id', verifySession.verifyUserLoggedIn, userControllers.wishlistPage);

router.get('/deleteWishlist/:id', verifySession.verifyUserLoggedIn, userControllers.deleteWishlist);

//Filter

router.post('/shopPriceFilter', verifySession.verifyUserLoggedIn, userControllers.priceFilter);

router.post('/shopPriceSort', verifySession.verifyUserLoggedIn, userControllers.sortPrice);
router.post('/user/userSearchProduct', verifySession.verifyUserLoggedIn, userControllers.userSearchProduct);

//paypal
router.get('/success', verifySession.verifyUserLoggedIn, userControllers.paypalSuccess);
router.post('/couponApply', verifySession.verifyUserLoggedIn, userControllers.couponApply);

//invoice
router.post('/setinvoice/:id',verifySession.verifyUserLoggedIn,userControllers.invoicegenerator)
//wallet
router.get('/wallet', verifySession.verifyUserLoggedIn, userControllers.getWallet);
module.exports = router;
