const mongoose = require("mongoose");

const evaluationSchema = new mongoose.Schema({
  application_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'application',
    required: true
  },
  juror_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  assigned_at: { 
    type: Date, 
    default: Date.now 
  },
  status: {
    type: String,
    enum: ['Beklemede', 'Değerlendirme Devam Ediyor', 'Tamamlandı'],
    default: 'Beklemede'
  },
  points: { 
    type: Number,
    default: 0
  },
  evaluation_report: { 
    type: String 
  },
  comments: { 
    type: String 
  },
  completed_at: { 
    type: Date 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Create a compound index to ensure one evaluation per juror per application
evaluationSchema.index({ application_id: 1, juror_id: 1 }, { unique: true });

class Evaluation extends mongoose.Model {
  // Mark evaluation as completed
  async complete(points, report, comments) {
    this.status = 'Tamamlandı';
    this.points = points;
    this.evaluation_report = report;
    this.comments = comments;
    this.completed_at = new Date();
    return this.save();
  }

  // Update evaluation status
  async updateStatus(status) {
    this.status = status;
    return this.save();
  }
}

evaluationSchema.loadClass(Evaluation);
module.exports = mongoose.model("evaluation", evaluationSchema);