const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Publication = require('../db/models/Publication');
const authMiddleware = require('../middleware/auth');
const { uploadFileToFirebase } = require('../utils/firebaseStorage');
const admin = require('firebase-admin');

// Uploads klasörünü oluştur
const uploadDir = path.join(__dirname, '..', 'uploads', 'publications');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Uploads klasörünü oluştur -> This becomes a temporary directory
const uploadTempDir = path.join(__dirname, '..', 'temp_uploads', 'publications'); // Changed directory name
if (!fs.existsSync(uploadTempDir)) {
  fs.mkdirSync(uploadTempDir, { recursive: true });
}

// Multer ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadTempDir); // Use the temporary directory
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
  // Keep temporary file path for cleanup
  const localFilePath = req.file ? req.file.path : null; 

  try {
    console.log('Gelen istek:', req.body);
    console.log('Dosya (geçici):', req.file); // Log temporary file info
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
      // No need to delete temp file here, will be handled in finally block or after successful upload
      return res.status(400).json({ error: 'Tüm zorunlu alanları doldurunuz.' });
    }

    // DOI kontrolü
    const existingPublication = await Publication.findOne({ doi: doi });
    if (existingPublication) {
       // No need to delete temp file here
      return res.status(400).json({ error: 'Bu DOI numarasına sahip bir yayın zaten mevcut.' });
    }

    // --- Firebase Upload ---
    // Define a destination path in Firebase Storage
    const firebaseFileName = `publication-${Date.now()}-${path.basename(localFilePath)}`; // More unique name
    const destinationPath = `publications/${applicationId}/${firebaseFileName}`; // Example path structure

    console.log(`Uploading temporary file ${localFilePath} to Firebase at ${destinationPath}`);
    // Call the utility function to upload the file from the temporary location
    // Using destinationPath as the reference to store in DB. Could also use signedUrl if needed immediately.
    const signedUrl = await uploadFileToFirebase(localFilePath, destinationPath); 
    console.log(`File uploaded to Firebase. Signed URL (for potential immediate use): ${signedUrl}`);
    // --- End Firebase Upload ---

    // Create the Publication document with the Firebase destination path
    const publication = new Publication({
      category,
      index,
      title,
      doi,
      publicationYear: Number(publicationYear),
      isMainAuthor: isMainAuthor === 'true' || isMainAuthor === true,
      // pdfFile: signedUrl, // Option 1: Store the signed URL (might expire)
      pdfFile: destinationPath, // Option 2: Store the Firebase path (recommended)
      application: applicationId
    });

    console.log('Kaydedilecek yayın (Firebase path):', publication);
    await publication.save();
    console.log('Yayın başarıyla kaydedildi (MongoDB)');

    // --- Respond ---
    res.status(201).json({
      success: true,
      publication: {
        _id: publication._id,
        category: publication.category,
        index: publication.index,
        title: publication.title,
        doi: publication.doi,
        publicationYear: publication.publicationYear,
        isMainAuthor: publication.isMainAuthor,
        pdfPath: publication.pdfFile // Send back the path
      }
    });

  } catch (error) {
    console.error('Yayın kaydetme veya Firebase yükleme hatası:', error);
    
    // MongoDB duplicate key hatası kontrolü (specific handling)
    if (error.code === 11000) {
      return res.status(400).json({ 
        error: 'Bu DOI numarasına sahip bir yayın zaten mevcut.',
        details: error.message 
      });
    }
    
    // Generic error response
    res.status(500).json({ 
      error: "Yayın kaydedilirken veya Firebase'e yüklenirken bir hata oluştu.",
      details: error.message,
    });

  } finally {
    // --- Cleanup Temporary File ---
    // Ensure the temporary file is deleted regardless of success or failure after Firebase step
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlink(localFilePath, (err) => {
        if (err) {
          console.error(`Error deleting temporary file ${localFilePath}:`, err);
        } else {
          console.log(`Successfully deleted temporary file: ${localFilePath}`);
        }
      });
    }
    // --- End Cleanup ---
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

// Yayın sil (MongoDB ve Firebase)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    
    if (!publication) {
      return res.status(404).json({ error: 'Yayın bulunamadı.' });
    }

    // TODO: Enhance authorization check - ensure user has permission to delete this specific publication
    // if (publication.application.toString() !== req.user.applicationId) { // Example check
    //   return res.status(403).json({ error: 'Bu yayını silme yetkiniz yok.' });
    // }

    const firebasePath = publication.pdfFile; // Get the stored Firebase path

    // --- Delete from Firebase Storage --- 
    if (firebasePath) { 
        let bucket; // Get bucket inside the handler
        try {
            bucket = admin.storage().bucket();
        } catch (initError) {
            console.error("Error getting storage bucket in /delete/:id:", initError);
            // Decide if this is critical - maybe log and continue to delete DB entry?
        }

        if (bucket) {
            try {
                console.log(`Deleting file from Firebase Storage: ${firebasePath}`);
                await bucket.file(firebasePath).delete();
                console.log(`Successfully deleted ${firebasePath} from Firebase Storage.`);
            } catch (firebaseError) {
                console.error(`Error deleting file ${firebasePath} from Firebase Storage:`, firebaseError.message);
                if (!firebaseError.message.includes('No such object')) {
                   // Log non-critical errors
                }
            }
        } else {
             console.error("Firebase bucket reference not available in /delete/:id route.");
        }
    }
    // --- End Firebase Delete --- 

    // Delete from MongoDB
    console.log(`Deleting publication record from MongoDB: ${req.params.id}`);
    await Publication.findByIdAndDelete(req.params.id);
    console.log(`Successfully deleted publication record from MongoDB: ${req.params.id}`);

    res.json({ success: true, message: 'Yayın başarıyla silindi.' });

  } catch (error) {
    console.error(`Yayın silme hatası (publication ID: ${req.params.id}):`, error);
    res.status(500).json({ error: 'Yayın silinirken bir hata oluştu.', details: error.message });
  }
});

// PDF dosyasını GETIR (Firebase'den)
router.get('/pdf/:id', authMiddleware, async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);
    
    if (!publication) {
      return res.status(404).json({ error: 'Yayın bulunamadı.' });
    }

    // TODO: Add more robust authorization check if needed
    // Check if the requesting user has permission to access this specific publication's PDF
    // This might involve checking ownership via application_id or other criteria
    // Example (if application ID is stored on req.user):
    // if (publication.application.toString() !== req.user.applicationId) { 
    //   return res.status(403).json({ error: 'Bu yayının PDF dosyasına erişim yetkiniz yok.' });
    // }

    if (!publication.pdfFile) {
        return res.status(404).json({ error: 'Bu yayın için kayıtlı bir PDF yolu bulunamadı.' });
    }

    // --- Get Signed URL from Firebase --- 
    let bucket; // Get bucket inside the handler
    try {
        bucket = admin.storage().bucket();
    } catch (initError) {
        console.error("Error getting storage bucket in /pdf/:id:", initError);
        return res.status(500).json({ error: 'Depolama hizmetine ulaşılamıyor (init).' });
    }

    if (!bucket) {
        console.error("Firebase bucket reference not available in /pdf/:id route.");
        return res.status(500).json({ error: 'Depolama hizmetine ulaşılamıyor.' });
    }

    const firebasePath = publication.pdfFile; // Get the stored Firebase path
    const options = {
      version: 'v4',
      action: 'read', 
      expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
    };

    console.log(`Generating signed URL for Firebase path: ${firebasePath}`);
    const [signedUrl] = await bucket.file(firebasePath).getSignedUrl(options);
    // --- End Firebase Signed URL --- 

    // Option 1: Redirect the user to the signed URL
    // res.redirect(signedUrl);

    // Option 2: Send the signed URL back in the response (more flexible for clients)
    res.json({ 
        success: true, 
        message: "PDF erişim URL'si oluşturuldu.",
        pdfUrl: signedUrl 
    });

  } catch (error) {
    console.error(`PDF getirme hatası (publication ID: ${req.params.id}):`, error);
    if (error.message.includes('No such object')) {
        res.status(404).json({ error: 'PDF dosyası Firebase Storage üzerinde bulunamadı.' });
    } else {
        res.status(500).json({ error: 'PDF dosyası getirilirken bir hata oluştu.', details: error.message });
    }
  }
});

module.exports = router;