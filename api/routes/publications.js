const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Publication = require('../db/models/Publication');
const authMiddleware = require('../middleware/auth');

// Uploads klasörünü oluştur
const uploadDir = path.join(__dirname, '..', 'uploads', 'publications');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'publication-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Sadece PDF dosyaları yüklenebilir!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Publications router is working' });
});

// Yeni yayın ekle
router.post('/add', authMiddleware, upload.single('pdfFile'), async (req, res) => {
  try {
    console.log('Gelen istek:', req.body);
    console.log('Dosya:', req.file);
    console.log('Kullanıcı:', req.user);

    if (!req.file) {
      return res.status(400).json({ error: 'PDF dosyası gereklidir.' });
    }

    // Kullanıcının bir başvurusu olup olmadığını kontrol et
    const { application_id } = req.body;
    let applicationId = application_id;

    // Eğer başvuru ID'si gönderilmemişse, kullanıcının aktif başvurusunu bul
    if (!applicationId) {
      const Application = require('../db/models/Application');
      const activeApplication = await Application.findOne({ 
        aday_id: req.user._id,
        'durum_gecmisi.0.durum': 'Beklemede' // En son durum "Beklemede" olan başvuruyu bul
      }).sort({ created_at: -1 }); // En son oluşturulan başvuruyu al

      if (!activeApplication) {
        // Kullanıcının aktif başvurusu yoksa geçici bir başvuru oluştur
        const newApplication = new Application({
          aday_id: req.user._id,
          ilan_id: req.body.ilan_id || null, // İlan ID'si varsa ekle, yoksa null olarak ayarla
          durum_gecmisi: [{
            durum: 'Beklemede',
            tarih: new Date(),
            aciklama: 'Yayın ekleme için otomatik oluşturuldu'
          }]
        });

        await newApplication.save();
        applicationId = newApplication._id;
      } else {
        applicationId = activeApplication._id;
      }
    }

    const { category, index, title, doi, publicationYear, isMainAuthor } = req.body;

    // Zorunlu alanları kontrol et
    if (!category || !index || !title || !doi || !publicationYear) {
      // Yüklenen dosyayı sil
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Tüm zorunlu alanları doldurunuz.' });
    }

    // DOI kontrolü
    const existingPublication = await Publication.findOne({ doi: doi });
    if (existingPublication) {
      // Yüklenen dosyayı sil
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Bu DOI numarasına sahip bir yayın zaten mevcut.' });
    }

    const publication = new Publication({
      category,
      index,
      title,
      doi,
      publicationYear: Number(publicationYear),
      isMainAuthor: isMainAuthor === 'true' || isMainAuthor === true,
      pdfFile: req.file.path,
      application: applicationId
    });

    console.log('Kaydedilecek yayın:', publication);

    await publication.save();

    console.log('Yayın başarıyla kaydedildi');

    res.status(201).json({
      success: true,
      publication: {
        _id: publication._id,
        category: publication.category,
        index: publication.index,
        title: publication.title,
        doi: publication.doi,
        publicationYear: publication.publicationYear,
        isMainAuthor: publication.isMainAuthor
      }
    });
  } catch (error) {
    console.error('Yayın kaydetme hatası:', error);
    // Hata durumunda dosyayı sil
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    // MongoDB duplicate key hatası kontrolü
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Bu DOI numarasına sahip bir yayın zaten mevcut.',
        details: error.message 
      });
    }

    res.status(500).json({ 
      error: 'Yayın kaydedilirken bir hata oluştu.',
      details: error.message 
    });
  }
});

// Başvuruya ait yayınları getir
router.get('/application/:applicationId', authMiddleware, async (req, res) => {
  try {
    const publications = await Publication.find({ 
      application: req.params.applicationId 
    }).select('-pdfFile');

    res.json({
      success: true,
      publications,
      stats: {
        total: publications.length,
        a1a2Count: publications.filter(p => ['A1', 'A2'].includes(p.category)).length,
        a1a4Count: publications.filter(p => ['A1', 'A2', 'A3', 'A4'].includes(p.category)).length,
        a1a5Count: publications.filter(p => ['A1', 'A2', 'A3', 'A4', 'A5'].includes(p.category)).length,
        mainAuthorCount: publications.filter(p => p.isMainAuthor).length
      }
    });
  } catch (error) {
    console.error('Yayınları getirme hatası:', error);
    res.status(500).json({ error: 'Yayınlar getirilirken bir hata oluştu.' });
  }
});

// Yayın sil
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    
    if (!publication) {
      return res.status(404).json({ error: 'Yayın bulunamadı.' });
    }

    // Yayının başvuru sahibine ait olduğunu kontrol et
    if (publication.application.toString() !== req.user.applicationId) {
      return res.status(403).json({ error: 'Bu yayını silme yetkiniz yok.' });
    }

    // PDF dosyasını sil
    if (publication.pdfFile && fs.existsSync(publication.pdfFile)) {
      fs.unlinkSync(publication.pdfFile);
    }

    await Publication.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Yayın silme hatası:', error);
    res.status(500).json({ error: 'Yayın silinirken bir hata oluştu.' });
  }
});

// PDF dosyasını indir
router.get('/pdf/:id', authMiddleware, async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    
    if (!publication) {
      return res.status(404).json({ error: 'Yayın bulunamadı.' });
    }

    // Yayının başvuru sahibine ait olduğunu kontrol et
    if (publication.application.toString() !== req.user.applicationId) {
      return res.status(403).json({ error: 'Bu yayının PDF dosyasına erişim yetkiniz yok.' });
    }

    if (!fs.existsSync(publication.pdfFile)) {
      return res.status(404).json({ error: 'PDF dosyası bulunamadı.' });
    }

    res.sendFile(path.resolve(publication.pdfFile));
  } catch (error) {
    console.error('PDF getirme hatası:', error);
    res.status(500).json({ error: 'PDF dosyası getirilirken bir hata oluştu.' });
  }
});

module.exports = router;