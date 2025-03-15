const mongoose = require("mongoose");

const schema = mongoose.Schema( {
    tc_kimlik_no: { type: String, unique: true, required: true, minlength: 11, maxlength: 11 },
    ad: { type: String, required: true },
    soyad: { type: String, required: true },
    sifre_hash: { type: String, required: true }, // Hashed password
    rol: { type: String, enum: ['Aday', 'Admin', 'Yönetici', 'Jüri Üyesi'], required: true }
}, 
{ timestamps: {
    versionKey: "false",
    createdAt: "created_at",
    updatedAt: "updated_at"
} }
);

class Users extends mongoose.Model{

}

schema.loadClass(Users);
module.exports = mongoose.model("users", schema);