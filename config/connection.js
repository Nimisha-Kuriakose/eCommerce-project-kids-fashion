const MongoClient=require('mongodb-legacy').MongoClient 
const state={
    db:null
}
module.exports.connect=function(done){
    const url= process.env.  DATABASE_URL
    const dbname= process.env.DB_NAME
    MongoClient.connect(url,(err,data)=>{
        if(err)  return done(err)
        state.db=data.db(dbname)
    })
    done()
}
module.exports.get=function(){
    return state.db
} 