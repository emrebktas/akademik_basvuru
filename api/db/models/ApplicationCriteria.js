const mongoose = require('mongoose');

const applicationCriteriaSchema = new mongoose.Schema({
  fieldGroup: {
    type: String,
    enum: ['saglik-fen', 'egitim-sosyal', 'hukuk-ilahiyat', 'guzel-sanatlar'],
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  minLanguageScore: {
    type: Number,
    default: 65
  },
  publicationCriteria: {
    minTotalPublications: {
      type: Number,
      required: true
    },
    minA1A2Publications: {
      type: Number,
      required: true
    },
    minA1A4Publications: {
      type: Number,
      required: true
    },
    minA1A5Publications: {
      type: Number,
      required: true
    },
    minMainAuthorPublications: {
      type: Number,
      required: true
    },
    minA1A4Points: {
      type: Number,
      required: true,
      default: 45
    },
    minA1A5Points: {
      type: Number,
      required: true,
      default: 5
    }
  },
  pointCriteria: {
    minPoints: {
      type: Number,
      required: true
    },
    maxPoints: {
      type: Number,
      required: true
    }
  },
  acceptedLanguageExams: [{
    type: String,
    enum: ['YDS', 'YÖKDİL', 'TOEFL iBT', 'IELTS']
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Varsayılan kriterleri oluşturmak için metod
applicationCriteriaSchema.statics.createDefaultCriteria = async function() {
  const defaultCriteria = [
    {
      fieldGroup: 'saglik-fen',
      displayName: 'Sağlık/Fen/Mat-Müh-Ziraat/Orman/Su Ürünleri',
      publicationCriteria: {
        minTotalPublications: 4,
        minA1A2Publications: 1,
        minA1A4Publications: 2,
        minA1A5Publications: 1,
        minMainAuthorPublications: 1,
        minA1A4Points: 45,
        minA1A5Points: 5
      },
      pointCriteria: {
        minPoints: 100,
        maxPoints: 250
      },
      acceptedLanguageExams: ['YDS', 'YÖKDİL', 'TOEFL iBT', 'IELTS'],
      minLanguageScore: 65
    },
    {
      fieldGroup: 'egitim-sosyal',
      displayName: 'Eğitim/Foloji/Mimarlık-Planlama-Tasarım/SBİB/Spor',
      publicationCriteria: {
        minTotalPublications: 3,
        minA1A2Publications: 1,
        minA1A4Publications: 1,
        minA1A5Publications: 1,
        minMainAuthorPublications: 1,
        minA1A4Points: 45,
        minA1A5Points: 5
      },
      pointCriteria: {
        minPoints: 90,
        maxPoints: 250
      },
      acceptedLanguageExams: ['YDS', 'YÖKDİL', 'TOEFL iBT', 'IELTS'],
      minLanguageScore: 65
    },
    {
      fieldGroup: 'hukuk-ilahiyat',
      displayName: 'Hukuk/İlahiyat',
      publicationCriteria: {
        minTotalPublications: 2,
        minA1A2Publications: 0,
        minA1A4Publications: 1,
        minA1A5Publications: 1,
        minMainAuthorPublications: 1,
        minA1A4Points: 45,
        minA1A5Points: 5
      },
      pointCriteria: {
        minPoints: 80,
        maxPoints: 250
      },
      acceptedLanguageExams: ['YDS', 'YÖKDİL', 'TOEFL iBT', 'IELTS'],
      minLanguageScore: 65
    },
    {
      fieldGroup: 'guzel-sanatlar',
      displayName: 'Güzel Sanatlar',
      publicationCriteria: {
        minTotalPublications: 2,
        minA1A2Publications: 0,
        minA1A4Publications: 1,
        minA1A5Publications: 1,
        minMainAuthorPublications: 1,
        minA1A4Points: 45,
        minA1A5Points: 5
      },
      pointCriteria: {
        minPoints: 80,
        maxPoints: 250
      },
      acceptedLanguageExams: ['YDS', 'YÖKDİL', 'TOEFL iBT', 'IELTS'],
      minLanguageScore: 65
    }
  ];

  for (const criteria of defaultCriteria) {
    try {
      const result = await this.findOneAndUpdate(
        { fieldGroup: criteria.fieldGroup },
        { $set: criteria },
        { upsert: true, new: true, overwrite: true }
      );
      console.log(`Criteria for ${criteria.fieldGroup} created/updated:`, result);
    } catch (error) {
      console.error(`Error updating criteria for ${criteria.fieldGroup}:`, error);
    }
  }
};

const ApplicationCriteria = mongoose.model('application_criteria', applicationCriteriaSchema);
module.exports = ApplicationCriteria; 