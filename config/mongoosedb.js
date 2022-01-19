// const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
// const MongooseClient = new MongoClient(process.env.MONGOOSE_URI);

// class ContextDb {
//     constructor() {
//     }
//     connect(callback) {
//         MongooseClient.connect()
//             .then(result => {
//                 console.log('Connected to MongoDb server');
//                 this._db = result.db();
//                 if (callback instanceof Function) callback(this_db);
//             }).catch(err => {
//                 console.log(err.stack);
//             }).finally(() => {
//                 MongooseClient.close();
//             })
//     }
//     getDb() {
//         if (this._db) {
//             return this._db;
//         }
//         throw new Error('There are no database');
//         // console.log("error on database");
//     }
// }

function connectToMongoDB(callback) {
    // let uri = process.env.MONGOOSE_URI;
    let uri = "mongodb://127.0.0.1:27017/test";
    return mongoose
        .connect(uri)
        .then(client => {
            console.log('Connected to MongoDb server', client.connection.host);
            if (callback instanceof Function) callback(client)
        })
        .catch(err => {
            console.log("MongoDb cannot connect to server !");
            console.log(err);
        })
}


// module.exports = new ContextDb();
module.exports = connectToMongoDB;