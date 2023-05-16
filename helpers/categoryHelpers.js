const db = require('../config/connection');
const collection = require('../config/collections');
const objectId = require('mongodb-legacy').ObjectId;

module.exports = {
    // addCategory:(detailes) => {
    //     return new Promise (async (resolve, reject) => {
    //             const Category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({name: detailes.name})
    //             if(Category){
    //                 resolve(false)
    //             }else{
    //                 detailes.listed = true;
    //                 db.get().collection(collection.CATEGORY_COLLECTION).insertOne(detailes).then((response) => {
    //                     resolve(response.insertedId);
    //                 })
    //             }
    //     })
    // },

    addCategory: (details) => {
        return new Promise(async (resolve, reject) => {
          const name =details.name
          const categoryName = details.name.toLowerCase(); // Convert category name to lowercase
          const category = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ name: { $regex: new RegExp("^" + categoryName + "$", "i") } }); // Use case-insensitive regex to find category
          if (category) {
            resolve(false);
          } else  {
            details.name=name
            details.name = categoryName; // Save lowercase category name
            details.listed = true;
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(details).then((response) => {
              resolve(response.insertedId);
              
            });
          }
        
        });
      },
      
    getCategory: () => {
        return new Promise (async (resolve, reject) => {
           const category = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray();
            if(category){
                console.log(category);
                resolve(category)
            }else{
                
                resolve("Category not found");
            }
        })
    },

    deleteCategory: (categoryId, cateName) => {
      return new Promise((resolve, reject) => {
          db.get().collection(collection.CATEGORY_COLLECTION).deleteOne(
              {
                  _id: new objectId(categoryId)
              }
          ).then(async () => {
              const listed = await db.get().collection(collection.PRODUCT_COLLECTION).updateMany(
                  {
                      category: cateName
                  },
                  {
                      $set: {
                          listed: false
                      }
                  }
              )
              console.log(listed);
              
              resolve();
          }).catch((err) => {
              console.log(err);
              reject();
          })
       })
    },

    getSelectedCategory:(catName)=>{
        console.log(catName);
        return new Promise(async(resolve, reject)=>{
            try{
                const products = await db.get().collection(collection.CATEGORY_COLLECTION).aggregate(
                    [
                        {
                          '$match': {
                            'name': catName
                          }
                        }, {
                          '$lookup': {
                            'from': collection.PRODUCT_COLLECTION, 
                            'localField': 'name', 
                            'foreignField': 'category', 
                            'as': 'productDetails'
                          }
                        }, {
                          '$project': {
                            'productDetails': 1, 
                            '_id': 0
                          }
                        }
                    ]).toArray();
                // console.log(products[0].productDetails);
                resolve(products[0].productDetails);
            }catch{
                resolve(null);
            }
        })
    }
}