const mongoose = require("mongoose");

const schema = mongoose.Schema({
    ilan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'academic_post', required: true },
    aday_id: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    durum_gecmisi: [{
        durum: { type: String, enum: ['Beklemede', 'Onaylandı', 'Reddedildi', 'Juri Değerlendirmesinde'] },
        tarih: { type: Date, default: Date.now },
        aciklama: { type: String }
    }],
    puan: { type: Number, default: null },
    puan_dagilimi: [{
        category: String,
        criteria: String,
        points: Number,
        document_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'application_document' }]
    }],
    jury_members: [{
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        role: { type: String, enum: ['Başkan', 'Üye'] },
        evaluation_status: { type: String, enum: ['Beklemede', 'Tamamlandı'], default: 'Beklemede' }
    }],
    final_decision: {
        status: { type: String, enum: ['Onaylandı', 'Reddedildi'] },
        date: { type: Date },
        explanation: { type: String }
    }
}, {
    timestamps: {
        versionKey: "false",
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
});

class Application extends mongoose.Model {
    // Add any custom methods here
}

schema.loadClass(Application);
module.exports = mongoose.model("application", schema);