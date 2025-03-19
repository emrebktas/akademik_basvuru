const mongoose = require("mongoose");

const schema = mongoose.Schema( {
    belge_tipi: { type: String, enum: ['İndeksli Yayın', 'Atıf Sayısı', 'Konferans Yayını'], required: true },
    dosya_yolu: { type: String, required: true }
}, 
{ timestamps: {
    versionKey: "false",
    createdAt: "created_at",
    updatedAt: "updated_at"
} }
);

class ApplicationDocument extends mongoose.Model{

}

schema.loadClass(ApplicationDocument);
module.exports = mongoose.model("application_document", schema);