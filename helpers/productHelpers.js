const db = require('../config/connection');
const collection = require('../config/collections');
const objectId = require('mongodb-legacy').ObjectId;

module.exports = {

  //Product CRUD
      addProducts: (product) => {
          return new Promise((resolve, reject)=>{
              product.price = Number(product.price);
              product.stock = Number(product.stock);
              db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
                  resolve(data.insertedId);
              })
          })
      },
      getProducts:(currentPage) => {
          return new Promise (async (resolve, reject) => {
              currentPage = parseInt(currentPage);
             
              const limit = 8;
              const skip = (currentPage-1)*limit;
              const productData = await db.get().collection(collection.PRODUCT_COLLECTION).find().skip(skip).limit(limit).toArray();
              if(productData){
                 
                  resolve(productData);
              }else{
                  resolve("No data to show")
              }
          })
        },
  
      getProductsAdmin:(currentPage) => {
          return new Promise (async (resolve, reject) => {
            currentPage = parseInt(currentPage);
              
              const limit = 8;
              const skip = (currentPage-1)*limit;
              const productData = await db.get().collection(collection.PRODUCT_COLLECTION).find().skip(skip).limit(limit).toArray();
            
              if(productData){
                  resolve(productData);
              }else{
                  resolve("No data to show")
              }
          })
        },
      
  
      getSingleProduct: (productId) => {
          return new Promise (async (resolve, reject) =>{
              const productSingleData = await db.get().collection(collection.PRODUCT_COLLECTION).findOne(
                  {
                      _id: new objectId(productId)
                  });
                 
                  resolve(productSingleData);
              })
      },
  
      editProduct: (productId, data) => {
          return new Promise((resolve, reject) => {
           
            productId = new objectId(productId)
            db.get().collection(collection.PRODUCT_COLLECTION)
              .updateOne(
                {
                  _id: productId
                },
                {
                  $set: {
                    name: data.name,
                    productid:data.productid,
                    category: data.category,
                    description: data.description,
                    price: Number(data.price),
                    //slug: slugify(`${data.name} ${data.category}`),
                    stock: Number(data.stock),
      
                  }
                }
              ).then((response) => {
                console.log(response);
                resolve()
              }).catch((err) => {
               
                reject();
              })
          })
        },
  
      deleteProducts: (productId) => {
          return new Promise ((resolve, reject) => {
             
              db.get().collection(collection.PRODUCT_COLLECTION).deleteOne(
                  {
                      _id: new objectId(productId)
                  }
              )
              .then((response) => {
                
                  resolve()
              })
              .catch((err) => {
                  
                  reject()
              })
          })
      },
      
      
  //Product Image
      addProductImage:(id, imgUrls)=>{
          return new Promise((resolve, reject)=>{
              
              db.get().collection(collection.PRODUCT_COLLECTION)
              .updateOne(
                  {
                      _id: new objectId(id)
                  },
                  {
                      $set:{
                          images: imgUrls
                      }
                  }
              )
              .then((response)=>{
                  console.log(response);
                  resolve();
              })
              .catch((err)=>{
                  console.log(err);
                  reject()
              })
          })
      },
       totalPages:()=> {
          return new Promise(async (resolve, reject) => {
              const totalCount = await db.get().collection(collection.PRODUCT_COLLECTION).countDocuments({});
              resolve(totalCount);
          })
      },
  
      totalOrdersPlaced:() => {
          return new Promise (async (resolve, reject) => {
              try{
                  const orderPlacedCount = await db.get().collection(collection.ORDER_COLLECTION).countDocuments({});
                  resolve(orderPlacedCount);
              }catch{
                  resolve(0)
              }
          })
      },
      totalPagesOfOrder:()=>{
          return new Promise(async (resolve, reject) => {
              const totalPages = await db.get().collection(collection.ORDER_COLLECTION).countDocuments({});
              resolve(totalPages);
          })
        },
  
      editProductImage: (id, imgUrls) => {
          return new Promise ((resolve , reject) => {
              db.get().collection(collection.PRODUCT_COLLECTION)
              .updateOne(
                  {
                      _id: new objectId(id)
                  },
                  {
                      $set: {
                          images: imgUrls
                      }
                  }
              ).then((response) => {
                  
                  resolve()
              }).catch((err) => {
                 
                  reject()
              })
          })
      },
  
      getListedCategory:()=>{
          return new Promise(async(resolve, reject)=>{
              const categories = await db.get().collection(collection.CATEGORY_COLLECTION).find(
                  {
                      listed : true
                  }
              ).toArray();
              
              resolve(categories);
          })
      },
      filterPrice: (minPrice, maxPrice, Category) => {
          return new Promise(async (resolve, reject) => {
            let filteredProducts;
            if (Category) {
              filteredProducts = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                {
                  $lookup: {
                    from: 'category',
                    localField: 'category',
                    foreignField: 'name',
                    as: 'result'
                  }
                },
                {
                  $match: {
                    category: Category
                  }
                },
                {
                  $match: {
                    price: {
                      $gte: parseInt(minPrice),
                      $lte: parseInt(maxPrice),
                    }
                  }
                },
  
                {
                  $match: {
                      listed: true,
                  }
                }
  
              ]).toArray();
            } else {
              filteredProducts = await db.get().collection(collection.PRODUCT_COLLECTION).find({
                price: {
                  $gte: parseInt(minPrice),
                  $lte: parseInt(maxPrice),
                }, listed: true }).toArray();
            }
            resolve(filteredProducts);
          })
        },
  
        sortPrice:(detailes, category) => {
         
            return new Promise (async (resolve, reject) => {
            try{
                const minPrice = Number(detailes.minPrice);
                const maxPrice = Number(detailes.maxPrice);
                const value = detailes.sort;
                
                let product;
        
                if(category){
                    product = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                        {
                          $lookup: {
                            from: 'category',
                            localField: 'category',
                            foreignField: 'name',
                            as: 'result'
                          }
                        },
                        {
                          $match: {
                            category: category
                          }
                        },
                        {
                          $match: {
                            price: {
                              $gte: parseInt(minPrice),
                              $lte: parseInt(maxPrice)
                            }
                          }
                        }
                      ]).sort({price: value}).toArray();
        
                }else{
                    product = await db.get().collection(collection.PRODUCT_COLLECTION).find({
                        price: {
                            $gte: parseInt(minPrice),
                            $lte: parseInt(maxPrice)
                          }
                    }).sort({price: value}).toArray();
                }
                resolve(product);
             
                 
            }catch{
                
            }
                
            });
          },
        userSearchProduct: (search) => {
    return new Promise(async (resolve, reject) => {
      try {
        const productData = await db
          .get()
          .collection(collection.PRODUCT_COLLECTION)
          .find({
            name: { $regex: new RegExp(search), $options: "i" },
          })
          .toArray();
        resolve(productData);
      } catch (err) {
        reject(err);
      }
    });
  },
  
        
      getSomeProducts: () => {
          return new Promise(async (resolve, reject) => {
            const someProduct = await db.get().collection(collection.PRODUCT_COLLECTION).find().limit(8).toArray();
            if (someProduct) {
              resolve(someProduct)
            } else {
              resolve("No data found");
            }
          })
        },
      getRelatedProducts: (category) => {
        return new Promise(async (resolve, reject) => {
          const getRelatedProduct = await db.get().collection(collection.PRODUCT_COLLECTION).find({
            category: category
          }).limit(4).toArray();
          if (getRelatedProduct) {
            resolve(getRelatedProduct)
          } else {
            resolve("No data Found");
          }
        })
      },
  }