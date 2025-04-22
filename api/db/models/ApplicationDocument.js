const mongoose = require("mongoose");

const schema = mongoose.Schema({
    application_id: { type: mongoose.Schema.Types.ObjectId, ref: 'application', required: true },
    belge_tipi: { type: String, required: true },
    dosya_yolu: { type: String, required: true },
    dosya_adi: { type: String, required: true },
    dosya_boyutu: { type: Number, required: true },
    metadata: {
        criteria_id: { type: mongoose.Schema.Types.ObjectId, ref: 'position_criteria.criteria.sub_criteria' },
        author_count: { type: Number, default: 1 },
        author_index: { type: Number, default: 1 },
        is_corresponding_author: { type: Boolean, default: false },
        impact_factor: { type: Number },
        year: { type: Number },
        journal: { type: String },
        citation_count: { type: Number },
        conference_name: { type: String },
        conference_type: { type: String, enum: ['Ulusal', 'Uluslararası'] }
    },
    yuklenme_tarihi: { type: Date, default: Date.now },
    aciklama: { type: String },
    durum: { type: String, enum: ['Kabul Edildi', 'Reddedildi', 'İnceleniyor'], default: 'İnceleniyor' },
    calculated_points: { type: Number, default: 0 }
}, {
    timestamps: {
        versionKey: "false",
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
});

class ApplicationDocument extends mongoose.Model {
    // Add any custom methods here
}

schema.loadClass(ApplicationDocument);
module.exports = mongoose.model("application_document", schema);