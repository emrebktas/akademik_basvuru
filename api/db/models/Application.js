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
        evaluation_status: { type: String, enum: ['Beklemede', 'Tamamlandı'], default: 'Beklemede' },
        evaluation: {
            decision: { type: String, enum: ['Olumlu', 'Olumsuz'] },
            comments: { type: String },
            report_url: { type: String },
            report_name: { type: String },
            date: { type: Date }
        }
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
    // Jüri atamalarını kontrol eden metod
    async checkJuryEvaluationStatus() {
        // Tüm jüri üyeleri değerlendirme yaptı mı?
        if (this.jury_members && this.jury_members.length > 0) {
            const allCompleted = this.jury_members.every(member => 
                member.evaluation_status === 'Tamamlandı'
            );
            
            if (allCompleted) {
                // Olumlu/olumsuz oyları say
                const positiveVotes = this.jury_members.filter(
                    member => member.evaluation && member.evaluation.decision === 'Olumlu'
                ).length;
                
                const totalVotes = this.jury_members.length;
                const majorityNeeded = Math.ceil(totalVotes / 2);
                
                // Çoğunluk kararı
                if (positiveVotes >= majorityNeeded) {
                    return 'Onaylandı';
                } else {
                    return 'Reddedildi';
                }
            }
        }
        
        return null;
    }
    
    // Jüri üyesinin değerlendirmesini kaydetme metodu
    async saveJuryEvaluation(juryId, evaluationData) {
        const juryIndex = this.jury_members.findIndex(
            member => member.user_id.toString() === juryId.toString()
        );
        
        if (juryIndex === -1) {
            throw new Error('Jüri üyesi bu başvuruya atanmamış.');
        }
        
        this.jury_members[juryIndex].evaluation = evaluationData;
        this.jury_members[juryIndex].evaluation_status = 'Tamamlandı';
        
        return this.save();
    }
}

schema.loadClass(Application);
module.exports = mongoose.model("application", schema);