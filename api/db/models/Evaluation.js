const mongoose = require("mongoose");

const schema = mongoose.Schema( {
    ilan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    juri_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    yorum: { type: String, required: true },
    puan: { type: Number, required: true, min: 0, max: 100 },
    durum: { type: String, enum: ['Olumlu', 'Olumsuz'], required: true }
}, 
{ timestamps: {
    versionKey: "false",
    createdAt: "created_at",
    updatedAt: "updated_at"
} }
);

class Evaluation extends mongoose.Model{

}

schema.loadClass(Evaluation);
module.exports = mongoose.model("evaluation", schema);