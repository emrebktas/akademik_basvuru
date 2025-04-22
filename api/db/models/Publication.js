const mongoose = require('mongoose');

const publicationSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'],
    required: true
  },
  index: {
    type: String,
    enum: ['Q1', 'Q2', 'Q3', 'Q4', 'ESCI', 'Scopus', 'TR Dizin'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  doi: {
    type: String,
    required: true
  },
  publicationYear: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear()
  },
  isMainAuthor: {
    type: Boolean,
    default: false
  },
  pdfFile: {
    type: String,
    required: true
  },
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Aynı DOI numarasına sahip makale eklenemez
publicationSchema.index({ doi: 1 }, { unique: true });

// İstatistik metodları
publicationSchema.statics.getPublicationStats = async function(applicationId) {
  const stats = await this.aggregate([
    { $match: { application: applicationId } },
    {
      $group: {
        _id: null,
        a1a2Count: {
          $sum: {
            $cond: [{ $in: ["$category", ["A1", "A2"]] }, 1, 0]
          }
        },
        a1a4Count: {
          $sum: {
            $cond: [{ $in: ["$category", ["A1", "A2", "A3", "A4"]] }, 1, 0]
          }
        },
        a1a5Count: {
          $sum: {
            $cond: [{ $in: ["$category", ["A1", "A2", "A3", "A4", "A5"]] }, 1, 0]
          }
        },
        mainAuthorCount: {
          $sum: { $cond: ["$isMainAuthor", 1, 0] }
        },
        totalCount: { $sum: 1 }
      }
    }
  ]);

  return stats.length > 0 ? stats[0] : {
    a1a2Count: 0,
    a1a4Count: 0,
    a1a5Count: 0,
    mainAuthorCount: 0,
    totalCount: 0
  };
};

const Publication = mongoose.model('Publication', publicationSchema);
module.exports = Publication; 