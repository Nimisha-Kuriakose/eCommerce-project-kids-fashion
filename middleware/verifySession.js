module.exports=
{
    verifyUserLoggedIn: (req, res, next) => {
        try {
          if (req.session.userLoggedIn) {
            next();
          } else {
            res.redirect('/login');
          }
        } catch (error) {
          // Handle the error
          console.log(error);
          res.status(500).send('Internal Server Error');
        }
      },
      
      ifUserLoggedIn: (req, res, next) => {
        try {
          if (req.session.userLoggedIn) {
            res.redirect('/');
          } else {
            next();
          }
        } catch (error) {
          // Handle the exception here
          console.error('Error in ifUserLoggedIn middleware:', error);
          next(error); // Pass the error to the error-handling middleware
        }
      },
      
      verifyAdminLoggedIn: (req, res, next) => {
        try {
            if (req.session.adminLoggedIn) {
                next();
            } else {
                res.redirect('/admin');
            }
        } catch (error) {
            // Handle the exception here
            console.error('An error occurred in verifyAdminLoggedIn middleware:', error);
            res.status(500).send('Internal Server Error');
        }
    },
    

    ifAdminLoggedIn: (req, res, next) => {
        try {
          if (req.session.adminLoggedIn) {
            res.redirect('/admin/adminPanel');
          } else {
            next();
          }
        } catch (error) {
          // Handle the exception here
          next(error); // Pass the error to the error handling middleware
        }
      }
      
}