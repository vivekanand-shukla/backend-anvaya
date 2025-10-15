const mongoose = require("mongoose")
require('dotenv').config() 
const mongiUri = process.env.MONGODB

async  function connectDB(){
     await mongoose.connect(mongiUri).then(()=>{
        console.log("mongodb Connected Successfuly")
    }).catch((error)=> {
        console.log("an error occured while conecting the db" , error)
    })
}
module.exports = {connectDB}



