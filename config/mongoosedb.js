// const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

function connectToMongoDB(callback) {
    // let uri = process.env.MONGOOSE_URI;
    let uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@e-commerce.zf1wu.mongodb.net/${process.env.MONGO_DATABASE}?retryWrites=true&w=majority`
    // let uri = "mongodb://127.0.0.1:27017/test";
    return mongoose
        .connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        .then(client => {
            console.log('Connected to MongoDb server', client.connection.name);
            if (callback instanceof Function) callback(client)
        })
        .catch(err => {
            console.log('mongo uri', uri);
            console.log("MongoDb cannot connect to server !");
            console.log(err);
        })
}


// module.exports = new ContextDb();
module.exports = connectToMongoDB;
