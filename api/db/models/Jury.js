const mongoose = require("mongoose");

const schema = mongoose.Schema( {
    ilan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicPost', required: true },
    juri_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, 
{ timestamps: {
    versionKey: "false",
    createdAt: "created_at",
    updatedAt: "updated_at"
} }
);

class Jury extends mongoose.Model{

}

schema.loadClass(Jury);
module.exports = mongoose.model("jury", schema);