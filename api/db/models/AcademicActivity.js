const mongoose = require('mongoose');

// Ortak şema özellikleri
const commonFields = {
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  proofFile: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
};

// Proje şeması
const projectSchema = new mongoose.Schema({
  ...commonFields,
  type: {
    type: String,
    enum: ['TÜBİTAK', 'AB', 'BAP', 'Diğer'],
    required: true
  },
  role: {
    type: String,
    enum: ['Yürütücü', 'Araştırmacı', 'Danışman'],
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  duration: {
    type: Number, // Ay cinsinden
    required: true
  },
  category: {
    type: String,
    enum: ['H', 'G'], // Tablo 3'teki kategoriler
    required: true
  }
});

// Kitap şeması
const bookSchema = new mongoose.Schema({
  ...commonFields,
  type: {
    type: String,
    enum: ['Kitap', 'Kitap Bölümü'],
    required: true
  },
  publisher: {
    type: String,
    required: true
  },
  isbn: {
    type: String,
    required: true
  },
  chapterInfo: {
    type: String,
    required: function() {
      return this.type === 'Kitap Bölümü';
    }
  },
  category: {
    type: String,
    enum: ['C'], // Tablo 3'teki kategori
    required: true
  }
});

// Atıf şeması
const citationSchema = new mongoose.Schema({
  ...commonFields,
  citingWork: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear()
  },
  index: {
    type: String,
    enum: ['WoS', 'Scopus'],
    required: true
  },
  category: {
    type: String,
    enum: ['D'], // Tablo 3'teki kategori
    required: true
  }
});

// Bildiri şeması
const presentationSchema = new mongoose.Schema({
  ...commonFields,
  conference: {
    type: String,
    required: true
  },
  presentationType: {
    type: String,
    enum: ['Sözlü', 'Poster'],
    required: true
  },
  international: {
    type: Boolean,
    required: true
  },
  category: {
    type: String,
    enum: ['O'], // Tablo 3'teki kategori
    required: true
  }
});

// Ödül şeması
const awardSchema = new mongoose.Schema({
  ...commonFields,
  name: {
    type: String,
    required: true
  },
  institution: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear()
  },
  category: {
    type: String,
    enum: ['Ö'], // Tablo 3'teki kategori
    required: true
  }
});

// Modelleri oluştur
const Project = mongoose.model('Project', projectSchema);
const Book = mongoose.model('Book', bookSchema);
const Citation = mongoose.model('Citation', citationSchema);
const Presentation = mongoose.model('Presentation', presentationSchema);
const Award = mongoose.model('Award', awardSchema);

module.exports = {
  Project,
  Book,
  Citation,
  Presentation,
  Award
}; 