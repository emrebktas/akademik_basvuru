const mongoose = require("mongoose");

const juryEvaluationSchema = new mongoose.Schema({
  jury_member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  points: { type: Number, default: 0 },
  evaluation_report: { type: String },
  submitted_at: { type: Date, default: Date.now }
});

const evaluationSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'application',
    required: true
  },
  jury_evaluations: [juryEvaluationSchema],
  status: {
    type: String,
    enum: ['Beklemede', 'Değerlendirme Devam Ediyor', 'Tamamlandı'],
    default: 'Beklemede'
  },
  final_decision: {
    status: {
      type: String,
      enum: ['Beklemede', 'Kabul Edildi', 'Reddedildi'],
      default: 'Beklemede'
    },
    notes: { type: String },
    decision_date: { type: Date }
  },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Calculate average points from jury evaluations
evaluationSchema.virtual('average_points').get(function() {
  if (this.jury_evaluations.length === 0) return 0;
  const total = this.jury_evaluations.reduce((sum, eval) => sum + eval.points, 0);
  return total / this.jury_evaluations.length;
});

// Ensure all jury members have submitted their evaluations before final decision
evaluationSchema.pre('save', function(next) {
  if (this.final_decision.status !== 'Beklemede' && 
      this.jury_evaluations.length < this.jury.members.length) {
    return next(new Error('All jury members must submit their evaluations before final decision'));
  }
  next();
});

class Evaluation extends mongoose.Model{

}

evaluationSchema.loadClass(Evaluation);
module.exports = mongoose.model("evaluation", evaluationSchema);