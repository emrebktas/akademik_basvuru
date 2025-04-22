const mongoose = require('mongoose');

const subCriteriaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  points: { type: Number, default: 0 },
  required: { type: Boolean, default: false },
  calculation_rules: {
    type: {
      type: String,
      enum: ['publication', 'citation', 'conference', 'other'],
      required: true
    },
    author_count_factor: { type: Boolean, default: false },
    impact_factor_bonus: { type: Boolean, default: false },
    year_limit: { type: Number }, // For publications within last X years
    minimum_required: { type: Number } // Minimum number of items required
  }
});

const criteriaSchema = new mongoose.Schema({
  category: { type: String, required: true },
  sub_criteria: [subCriteriaSchema],
  minimum_points: { type: Number, required: true },
  maximum_points: { type: Number }
});

const positionCriteriaSchema = new mongoose.Schema({
  position_type: { 
    type: String, 
    required: true, 
    enum: ['Dr. Öğr. Üyesi', 'Doçent', 'Profesör'] 
  },
  criteria: [criteriaSchema],
  total_minimum_points: { type: Number, required: true },
  created_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'user',
    required: true 
  },
  updated_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('position_criteria', positionCriteriaSchema); 