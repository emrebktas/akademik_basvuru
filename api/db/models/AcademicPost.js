const mongoose = require("mongoose");

const schema = mongoose.Schema( {
    ilan_basligi: { type: String, required: true },
    ilan_aciklamasi: { type: String, required: true },
    kademe: { type: String, enum: ['Dr. Öğr. Üyesi', 'Doçent', 'Profesör'], required: true },
    basvuru_baslangic_tarihi: { type: Date, required: true },
    basvuru_bitis_tarihi: { type: Date, required: true },
    durum: { type: String, enum: ['Açık', 'Kapalı', 'Tamamlandı'], default: 'Açık' },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    required_documents: [{ type: String, enum: ['İndeksli Yayın', 'Atıf Sayısı', 'Konferans Yayını'] }]

}, 
{ timestamps: {
    versionKey: "false",
    createdAt: "created_at",
    updatedAt: "updated_at"
} }
);

class AcademicPost extends mongoose.Model{

}

schema.loadClass(AcademicPost);
module.exports = mongoose.model("academic_post", schema);