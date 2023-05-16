const adminHelpers = require('../helpers/adminHelpers');
const productHelpers = require('../helpers/productHelpers');
const userHelpers = require('../helpers/userhelpers');
const categoryHelpers = require('../helpers/categoryHelpers');
const cloudinary =  require('../utils/cloudinary');
module.exports = {
    

    // Admin Login & Logout
        adminLogin: (req, res) => {
            if(req.session.adminLoggedIn){
              
                res.redirect('/adminpanel')
            }else{
                const adminName = req.session.adminName;
                res.render('admin/adminlogin', {admin: true, passErr:req.session.passErr, emailErr:req.session.emailErr, adminName});
                req.session.passErr = false;
                req.session.emailErr = false;
            }
        },
    
        adminLoginPost: (req, res) => {
            adminHelpers.doAdminLogin(req.body).then((response) => {
                if(response.status == "Invalid password"){
                    req.session.passErr = response.status;
                    res.redirect('/admin');
                }else if(response.status == "Invalid user"){
                    req.session.emailErr = response.status;
                    res.redirect('/admin');
                }else{
                    req.session.admin = response.admin;
                    req.session.adminName = req.session.admin.email;
                    req.session.adminLoggedIn = true;
                    res.render('admin/adminpanel', {admin: true, adminName: req.session.adminName});
                }
            })
        },
    
        adminLogout: (req, res) => {
            req.session.adminLoggedIn = false;
            req.session.adminName = false;
            res.redirect('/admin');
        },
        //Admin Panel
        adminPanel: async (req, res) => {

        const jan = await adminHelpers.getMonthCount(1,2023)
        const feb = await adminHelpers.getMonthCount(2,2023)
        const mar = await adminHelpers.getMonthCount(3,2023)
        const apr = await adminHelpers.getMonthCount(4,2023)
        const may = await adminHelpers.getMonthCount(5,2023)
        const jun = await adminHelpers.getMonthCount(6,2023)
        const userCount =await adminHelpers.getUsersCount()
        const total = await adminHelpers.getLastMonthTotal()
        console.log('total check')
        console.log(total)
        const totalOrdersPlaced = await productHelpers.totalOrdersPlaced()
        let totalEarnings = 0;
        totalEarnings = await adminHelpers.getOrderTotalPrice();
        const deliveredCounts = await adminHelpers.getAllDeliveredOrdersCount();
        const placedCounts = await adminHelpers.getAllPlacedOrdersCount();
        const cancelledCounts = await adminHelpers.getAllCanceldOrdersCount();
        const returnCounts = await adminHelpers.getAllReturnOrdersCount();
        // const topProducts = await adminHelpers.getTopProduct();
        res.render('admin/adminpanel', {admin: true, adminName: req.session.adminName, deliveredCounts , placedCounts, cancelledCounts, returnCounts, userCount, totalOrdersPlaced, total, totalEarnings, jan,feb,mar,apr,may,jun});
    },

        adminregister: (req, res) => {
            res.render('/register');
            //req.session.emailExist = false;
        },
        adminUserManagement: async (req, res) => {
            const adminName = req.session.adminName;
            const userData = await adminHelpers.getUser();
            res.render('admin/adminusers', {admin: true, adminName, userData});
    }, 
    adminAddUserPost: (req, res) => {
        userHelpers.doSignUp(req.body).then((response) => {
            if(response == "Email already exist!!!"){
                req.session.emailExist = response;
                res.redirect('back');
            }else{
                res.redirect('back');
            }
        }).catch((err) => {
            console.log(err);
        })
    },
    adminAddUser: (req, res) => {
        const adminName = req.session.adminName;
        res.render('admin/addUser', {admin: true, adminName})
    },
    adminEditUser: (req, res) => {
        const userId  = req.params.id;
        adminHelpers.editUser(userId, req.body).then(() => {
            res.redirect('/admin/adminusers');
        }).catch((err) => {
            console.log(err);
        })
},
adminDeleteUser: (req, res) => {
    const userId = req.params.id;
    adminHelpers.deletUser(userId).then(() => {
        res.redirect('/admin/adminusers')
    }).catch((err) => {
        console.log(err);
    })
},
adminBlockUser: (req, res) => {
    const userId = req.params.id;
    console.log(userId);
    adminHelpers.blockUser(userId).then(() => {
        res.redirect('/admin/adminusers')
    }).catch((err) => {
        console.log(err);
    })
},
//Admin Product CRUD
adminProduct: async (req, res) => {
    const adminName = req.session.adminName;

        //pagination
    const totalPages = await productHelpers.totalPages();
    const currentPage = req.query.page || 1;
    const productData = await productHelpers.getProductsAdmin(currentPage);
    res.render('admin/adminProduct', { admin: true, adminName, productData ,totalPages,currentPage});
    },
adminAddProduct: (req, res) => {
    const adminName = req.session.adminName;
    categoryHelpers.getCategory().then((category) => {
        console.log(category);
        res.render('admin/adminAddProduct', {admin: true, adminName, category});
    });
    
    
},
adminSearchProduct: async (req, res) => {
    const adminName = req.session.adminName;

    const product = await adminHelpers.adminSearchProduct(req.body.name);

    res.render('admin/adminProduct', { admin: true, adminName, product })
    },

adminAddProductPost: (req, res) => {
    productHelpers.addProducts(req.body).then(async(id)=>{
        const imgUrls = [];
        try{
            for(let i=0;i<req.files.length;i++){
                const result = await cloudinary.uploader.upload(req.files[i].path);
                imgUrls.push(result.url);
            }
            console.log(imgUrls)
            productHelpers.addProductImage(id, imgUrls).then(()=>{}).catch(()=>{});
        }catch(err){
            console.log(`error : ${err}`);
        }finally{
            res.redirect('/admin/adminAddProduct');
        }
    });
},

adminEditProduct: (req, res) => {
        const productId = req.params.id;
        console.log(productId);
        productHelpers.editProduct(productId, req.body).then(async()=>{
            const imgUrls = [];
            try{
                for(let i=0;i<req.files.length;i++){
                    const result = await cloudinary.uploader.upload(req.files[i].path);
                    imgUrls.push(result.url);
                }

               if(imgUrls.length > 0){
                        productHelpers.editProductImage(productId, imgUrls).then(()=>{}).catch(()=>{});
                    }
            }catch(err){
                console.log(`error : ${err}`);
            }finally{
                res.redirect('/admin/adminProduct');
            }
        })
},
adminDeleteProduct: (req, res) => {
    const productId = req.params.id;
    productHelpers.deleteProducts(productId).then(() => {
        res.redirect('/admin/adminproduct')
    }).catch((err) => {
        console.log(err);
    })
},
// Admin Category Management
getCategory:(req, res) => {
    const adminName = req.session.adminName;
    categoryHelpers.getCategory().then((category) => {
        res.render('admin/adminCategory', {admin: true, adminName, category})
    });
},

addCategory:(req, res) => {
    categoryHelpers.addCategory(req.body).then(async(id) => {
        res.redirect('/admin/adminCategory');
    })
},

deleteCategory: (req, res) => {
    const category = req.params.id;
    const cateName = req.params.name;
    console.log(category);
    categoryHelpers.deleteCategory(category, cateName).then(() => {

        res.redirect('/admin/adminCategory');
    }).catch((err) => {
        console.log(err);
       })
    },

// Orders
adminOrder: (req, res) => {
    const adminName = req.session.adminName;
    adminHelpers.getUserOrder().then((adminOrder)=>{
        // console.log("api call");
        console.log(adminOrder);
        res.render('admin/adminOrder', {admin: true, adminName, adminOrder});
    })
},

adminOrderStatus:(req, res) => {
   const orderId = req.params.id;
//    const userId = req.body.userId;
   const status = req.body.status;
   console.log(req.body);
   
   adminHelpers.adminOrderStatus(orderId, status).then(() => {
    res.redirect('back');
   })
},


   // Admin SalesReport
   adminSalesReport: async (req, res) => {
    const deliveredOrders = await adminHelpers.getAllDeliveredOrders();

    let totalEarnings = 0;
    totalEarnings = await adminHelpers.getOrderTotalPrice();

    deliveredOrders.forEach(eachOrder => {
        eachOrder.productCount = eachOrder.products.length;

        // date formatting
        const newDate = new Date(eachOrder.date);
        const year = newDate.getFullYear();
        const month = newDate.getMonth() + 1;
        const day = newDate.getDate();
        const formattedDate = `${day < 10 ? '0' + day : day}-${month < 10 ? '0' + month : month}-${year}`;
        eachOrder.date = formattedDate;
      });
      res.render('admin/adminSalesReport', {admin: true, adminName:req.session.adminName,  deliveredOrders, totalEarnings})
},

adminSalesReportFilter:(req, res) => {
    req.redirect('/admin/adminSalesReport');
},

adminSalesReportFilterPost:(req, res) => {
    adminHelpers.filterDate(req.body.date).then((filteredOrders) => {

        let totalEarnings = 0;
        if(filteredOrders.length >=1 ){
            filteredOrders.forEach(eachOrder => {
                eachOrder.productCount = eachOrder.item.length;
                totalEarnings += eachOrder.total;

                // date formatting
                const newDate = new Date(eachOrder.date);
                const year = newDate.getFullYear();
                const month = newDate.getMonth() + 1;
                const day = newDate.getDate();
                const formattedDate = `${day < 10 ? '0' + day : day}-${month < 10 ? '0' + month : month}-${year}`;
                eachOrder.date = formattedDate;
            });
            
        }else{

            filteredOrders = false;
        }
        res.render('admin/adminSalesReport', {admin: true, adminName: req.session.adminName, deliveredOrders:filteredOrders, totalEarnings});
    })
},


    
    }