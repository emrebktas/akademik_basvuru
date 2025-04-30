const mongoose = require("mongoose");

const academicPostSchema = new mongoose.Schema({
    ilan_basligi: {
        type: String,
        required: true
    },
    ilan_aciklamasi: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    kademe: {
        type: String,
        enum: ['Dr. Öğr. Üyesi', 'Doçent', 'Profesör'],
        required: true
    },
    fieldGroup: {
        type: String,
        required: true,
        ref: 'ApplicationCriteria'
    },
    basvuru_baslangic_tarihi: {
        type: Date,
        required: true
    },
    basvuru_bitis_tarihi: {
        type: Date,
        required: true
    },
    durum: {
        type: String,
        enum: ['Açık', 'Kapalı', 'Tamamlandı'],
        default: 'Açık'
    },
    required_documents: [{
        type: String,
        enum: ['İndeksli Yayın', 'Atıf Sayısı', 'Konferans Yayını']
    }],
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    applications_count: {
        type: Number,
        default: 0
    },
    jury_assigned: {
        type: Boolean,
        default: false
    },
    jury: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'jury'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Başvuru kriterlerini getiren metod
academicPostSchema.methods.getCriteria = async function() {
    return await mongoose.model('ApplicationCriteria').findOne({ fieldGroup: this.fieldGroup });
};

// İlan aktif mi kontrol eden metod
academicPostSchema.methods.isPostActive = function() {
    const now = new Date();
    return this.is_active && this.basvuru_bitis_tarihi > now;
};

// Update applications count when applications are added or removed
academicPostSchema.methods.updateApplicationsCount = async function() {
    const count = await mongoose.model('application').countDocuments({ ilan_id: this._id });
    this.applications_count = count;
    await this.save();
};

// Güncelleme yapıldığında updated_at alanını otomatik güncelle
academicPostSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

const AcademicPost = mongoose.model('academic_post', academicPostSchema);
module.exports = AcademicPost;