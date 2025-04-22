const mongoose = require("mongoose");

const juryMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  role: {
    type: String,
    enum: ['Başkan', 'Üye'],
    default: 'Üye'
  },
  evaluation_status: {
    type: String,
    enum: ['Beklemede', 'Değerlendirildi', 'Tamamlandı'],
    default: 'Beklemede'
  },
  evaluation_report: {
    type: String
  },
  evaluation_date: {
    type: Date
  }
});

const jurySchema = new mongoose.Schema({
  academic_post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'academic_post',
    required: true
  },
  members: [juryMemberSchema],
  status: {
    type: String,
    enum: ['Oluşturuldu', 'Değerlendirme Devam Ediyor', 'Tamamlandı'],
    default: 'Oluşturuldu'
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  created_at: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Ensure there is exactly one jury president
jurySchema.pre('save', function(next) {
  const presidents = this.members.filter(member => member.role === 'Başkan');
  if (presidents.length !== 1) {
    return next(new Error('Jury must have exactly one president'));
  }
  next();
});

// Ensure there are at least 5 jury members
jurySchema.pre('save', function(next) {
  if (this.members.length < 5) {
    return next(new Error('Jury must have at least 5 members'));
  }
  next();
});

module.exports = mongoose.model("jury", jurySchema);