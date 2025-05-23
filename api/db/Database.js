let instance = null;
const mongoose = require("mongoose");
class Database {

    constructor() {
            if (!instance) {
                this.mongoConnection = null;
                instance = this;
            }
            return instance;
    }

    async connect(options) {
        try {
            console.log("db bağlanıyor...");
            let db = await mongoose.connect(options.CONNECTION_STRING); 
            this.mongoConnection = db;
            console.log("db bağlandı");
            
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
        

    }

}

module.exports = Database;