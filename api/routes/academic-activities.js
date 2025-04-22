const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Project, Book, Citation, Presentation, Award } = require('../db/models/AcademicActivity');
const authMiddleware = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/academic-activities');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Sadece PDF ve resim dosyaları yüklenebilir!'));
    }
  }
});

// Projects Routes
router.post('/projects', authMiddleware, upload.single('proofFile'), async (req, res) => {
  try {
    const { type, role, budget, duration } = req.body;
    const project = new Project({
      type,
      role,
      budget: Number(budget),
      duration: Number(duration),
      proofFile: req.file.path,
      application: req.user.applicationId,
      category: role === 'Yürütücü' ? 'H' : 'G'
    });

    await project.save();
    res.json({ success: true, project });
  } catch (error) {
    console.error('Project save error:', error);
    res.status(500).json({ error: 'Proje kaydedilirken bir hata oluştu.' });
  }
});

// Books Routes
router.post('/books', authMiddleware, upload.single('proofFile'), async (req, res) => {
  try {
    const { type, publisher, isbn, chapterInfo } = req.body;
    const book = new Book({
      type,
      publisher,
      isbn,
      chapterInfo,
      proofFile: req.file.path,
      application: req.user.applicationId,
      category: 'C'
    });

    await book.save();
    res.json({ success: true, book });
  } catch (error) {
    console.error('Book save error:', error);
    res.status(500).json({ error: 'Kitap kaydedilirken bir hata oluştu.' });
  }
});

// Citations Routes
router.post('/citations', authMiddleware, upload.single('proofFile'), async (req, res) => {
  try {
    const { citingWork, year, index } = req.body;
    const citation = new Citation({
      citingWork,
      year: Number(year),
      index,
      proofFile: req.file.path,
      application: req.user.applicationId,
      category: 'D'
    });

    await citation.save();
    res.json({ success: true, citation });
  } catch (error) {
    console.error('Citation save error:', error);
    res.status(500).json({ error: 'Atıf kaydedilirken bir hata oluştu.' });
  }
});

// Presentations Routes
router.post('/presentations', authMiddleware, upload.single('proofFile'), async (req, res) => {
  try {
    const { conference, presentationType, international } = req.body;
    const presentation = new Presentation({
      conference,
      presentationType,
      international: Boolean(international),
      proofFile: req.file.path,
      application: req.user.applicationId,
      category: 'O'
    });

    await presentation.save();
    res.json({ success: true, presentation });
  } catch (error) {
    console.error('Presentation save error:', error);
    res.status(500).json({ error: 'Bildiri kaydedilirken bir hata oluştu.' });
  }
});

// Awards Routes
router.post('/awards', authMiddleware, upload.single('proofFile'), async (req, res) => {
  try {
    const { name, institution, year } = req.body;
    const award = new Award({
      name,
      institution,
      year: Number(year),
      proofFile: req.file.path,
      application: req.user.applicationId,
      category: 'Ö'
    });

    await award.save();
    res.json({ success: true, award });
  } catch (error) {
    console.error('Award save error:', error);
    res.status(500).json({ error: 'Ödül kaydedilirken bir hata oluştu.' });
  }
});

// Get all activities for an application
router.get('/:applicationId', authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const [projects, books, citations, presentations, awards] = await Promise.all([
      Project.find({ application: applicationId }),
      Book.find({ application: applicationId }),
      Citation.find({ application: applicationId }),
      Presentation.find({ application: applicationId }),
      Award.find({ application: applicationId })
    ]);

    res.json({
      success: true,
      activities: {
        projects,
        books,
        citations,
        presentations,
        awards
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Akademik faaliyetler getirilirken bir hata oluştu.' });
  }
});

// Delete routes for each activity type
router.delete('/projects/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Proje bulunamadı.' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Proje silinirken bir hata oluştu.' });
  }
});

router.delete('/books/:id', authMiddleware, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Kitap bulunamadı.' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Kitap silinirken bir hata oluştu.' });
  }
});

router.delete('/citations/:id', authMiddleware, async (req, res) => {
  try {
    const citation = await Citation.findByIdAndDelete(req.params.id);
    if (!citation) {
      return res.status(404).json({ error: 'Atıf bulunamadı.' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Atıf silinirken bir hata oluştu.' });
  }
});

router.delete('/presentations/:id', authMiddleware, async (req, res) => {
  try {
    const presentation = await Presentation.findByIdAndDelete(req.params.id);
    if (!presentation) {
      return res.status(404).json({ error: 'Bildiri bulunamadı.' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Bildiri silinirken bir hata oluştu.' });
  }
});

router.delete('/awards/:id', authMiddleware, async (req, res) => {
  try {
    const award = await Award.findByIdAndDelete(req.params.id);
    if (!award) {
      return res.status(404).json({ error: 'Ödül bulunamadı.' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Ödül silinirken bir hata oluştu.' });
  }
});

module.exports = router; 