const mongoose = require("mongoose");

const schema = mongoose.Schema( {
    ilan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicPost', required: true },
    aday_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    durum_gecmisi: [{
        durum: { type: String, enum: ['Beklemede', 'Onaylandı', 'Reddedildi'] },
        tarih: { type: Date, default: Date.now }
    }],
    puan: { type: Number, default: null }
}, 
{ timestamps: {
    versionKey: "false",
    createdAt: "created_at",
    updatedAt: "updated_at"
} }
);

class Application extends mongoose.Model{

}

schema.loadClass(Application);
module.exports = mongoose.model("application", schema);