const express = require('express');
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Application = require('../db/models/Application');
const ApplicationDocument = require('../db/models/ApplicationDocument');
const AcademicPost = require('../db/models/AcademicPost');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const Publication = require('../db/models/Publication');

// Dosya yükleme için klasör oluştur
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Dosya yükleme ayarları
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const userDir = path.join(uploadDir, req.user._id.toString());
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        cb(null, userDir);
    },
    filename: function (req, file, cb) {
        const fileName = `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, fileName);
    }
});

// Dosya yükleme için multer konfigürasyonu
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Bir kullanıcının kendi başvurularını görüntüleme endpoint'i
router.get('/my-applications', authMiddleware, async (req, res) => {
    try {
        // Sadece aday rolüne sahip kullanıcılar kendi başvurularını görebilir
        if (req.user.rol !== 'Aday') {
            return res.status(403).json({
                message: 'Bu işlem için yetkiniz bulunmamaktadır. Sadece adaylar kendi başvurularını görüntüleyebilir.'
            });
        }

        // Kullanıcının başvurularını bul ve ilan detaylarını getir
        const applications = await Application.find({ aday_id: req.user._id })
            .populate('ilan_id')
            .sort({ 'durum_gecmisi.0.tarih': -1 }); // En son başvurulan ilk sırada

        console.log(`Fetched ${applications.length} applications for user ${req.user._id}`);

        // Her başvuru için belgeleri getir
        const result = await Promise.all(applications.map(async (app) => {
            const documents = await ApplicationDocument.find({ 
                application_id: app._id 
            });
            
            // Çıktıyı yapılandır
            return {
                _id: app._id,
                ilan: app.ilan_id,
                durum: app.durum_gecmisi[0].durum, // En son durum
                durum_gecmisi: app.durum_gecmisi,
                puan: app.puan,
                created_at: app.created_at,
                documents: documents
            };
        }));

        console.log(`Returning ${result.length} applications with details`);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Tek bir başvurunun detaylarını görüntüleme endpoint'i
router.get('/application/:id', authMiddleware, async (req, res) => {
    try {
        const applicationId = req.params.id;
        
        // Başvuruyu bul
        const application = await Application.findById(applicationId)
            .populate('ilan_id')
            .populate('aday_id', 'ad soyad tc_kimlik_no'); // Sadece gerekli aday bilgilerini getir
        
        if (!application) {
            return res.status(404).json({ message: 'Başvuru bulunamadı.' });
        }
        
        // Sadece adayın kendisi veya yönetici/jüri/admin görebilir
        if (req.user.rol === 'Aday' && req.user._id.toString() !== application.aday_id._id.toString()) {
            return res.status(403).json({ message: 'Bu başvuruyu görüntüleme yetkiniz yok.' });
        }
        
        // Başvuruya ait belgeleri getir
        const documents = await ApplicationDocument.find({ application_id: applicationId });
        
        // Çıktıyı yapılandır
        const result = {
            _id: application._id,
            ilan: application.ilan_id,
            aday: application.aday_id,
            durum: application.durum_gecmisi[0].durum,
            durum_gecmisi: application.durum_gecmisi,
            puan: application.puan,
            created_at: application.created_at,
            documents: documents
        };
        
        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching application details:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Çoklu dosya yükleme işlevselliği ile başvuru oluşturma
router.post('/apply', authMiddleware, async (req, res) => {
    try {
        if (req.user.rol !== 'Aday') {
            if (req.files?.length > 0) {
                req.files.forEach(file => fs.unlinkSync(file.path));
            }
            return res.status(403).json({ 
                message: 'Bu işlem için yetkiniz bulunmamaktadır.' 
            });
        }

        const { ilan_id, document_metadata } = req.body;
        if (!ilan_id) {
            return res.status(400).json({ message: 'İlan ID gereklidir.' });
        }

        const metadataArray = JSON.parse(document_metadata);
        if (!Array.isArray(metadataArray) || metadataArray.length !== req.files.length) {
            if (req.files?.length > 0) {
                req.files.forEach(file => fs.unlinkSync(file.path));
            }
            return res.status(400).json({ 
                message: 'Belge metadataları eksik veya hatalı.' 
            });
        }

        const academicPost = await AcademicPost.findById(ilan_id);
        if (!academicPost || academicPost.durum !== 'Açık') {
            if (req.files?.length > 0) {
                req.files.forEach(file => fs.unlinkSync(file.path));
            }
            return res.status(400).json({ 
                message: 'İlan kapalı veya mevcut değil.' 
            });
        }

        const application = new Application({
            ilan_id,
            aday_id: req.user._id,
            durum_gecmisi: [{ 
                durum: 'Beklemede',
                tarih: new Date()
            }]
        });

        await application.save();

        const documentPromises = req.files.map((file, index) => {
            const metadata = metadataArray[index];
            return new ApplicationDocument({
                application_id: application._id,
                belge_tipi: metadata.belge_tipi,
                dosya_yolu: file.path,
                dosya_adi: file.filename,
                dosya_boyutu: file.size,
                metadata: {
                    criteria_id: metadata.criteria_id,
                    author_count: metadata.author_count,
                    author_index: metadata.author_index,
                    is_corresponding_author: metadata.is_corresponding_author,
                    impact_factor: metadata.impact_factor,
                    year: metadata.year,
                    journal: metadata.journal,
                    citation_count: metadata.citation_count,
                    conference_name: metadata.conference_name,
                    conference_type: metadata.conference_type
                }
            }).save();
        });

        await Promise.all(documentPromises);
        await academicPost.updateApplicationsCount();

        res.status(201).json({ 
            message: 'Başvuru başarıyla tamamlandı.',
            application_id: application._id 
        });

    } catch (error) {
        console.error('Başvuru oluşturma hatası:', error);
        if (req.files?.length > 0) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Yeni eklenen get-posts endpoint'i
router.get('/get-posts', authMiddleware, async (req, res) => {
    try {
        // Admin ve Yönetici rollerinin tüm ilanları görebilmesi için yetki kontrolü
        if (req.user.rol !== 'Admin' && req.user.rol !== 'Yonetici') {
            return res.status(403).json({ 
                message: 'Bu işlem için yetkiniz bulunmamaktadır.'
            });
        }

        // Tüm ilanları getir
        const posts = await AcademicPost.find()
            .sort({ created_at: -1 }); // En son oluşturulan ilk sırada
        
        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Adaylar için public erişilebilir ilanlar endpoint'i
router.get('/public-posts', async (req, res) => {
    try {
        console.log('Public posts endpoint çağrıldı');
        
        // Sadece açık durumda olan ilanları getir
        const posts = await AcademicPost.find({ durum: 'Açık' })
            .sort({ created_at: -1 }); // En son oluşturulan ilk sırada
        
        console.log('Bulunan public posts sayısı:', posts.length);
        
        
        // Hiç ilan yoksa test için dummy veri döndür
        if (posts.length === 0) {
            console.log('Gerçek ilan bulunamadı, test verisi döndürülüyor');
            return res.status(200).json([
                {
                    _id: '60d0fe4f5311236168a109ca',
                    ilan_basligi: 'Test İlanı 1',
                    ilan_aciklamasi: 'Bu bir test ilanıdır. Gerçek API verisi olmadığı için gösterilmektedir.',
                    kademe: 'Dr. Öğr. Üyesi',
                    basvuru_baslangic_tarihi: new Date(),
                    basvuru_bitis_tarihi: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    durum: 'Açık',
                    required_documents: ['İndeksli Yayın', 'Atıf Sayısı']
                },
                {
                    _id: '60d0fe4f5311236168a109cb',
                    ilan_basligi: 'Test İlanı 2',
                    ilan_aciklamasi: 'İkinci test ilanı. API yanıtını test etmek için oluşturulmuştur.',
                    kademe: 'Doçent',
                    basvuru_baslangic_tarihi: new Date(),
                    basvuru_bitis_tarihi: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                    durum: 'Açık',
                    required_documents: ['Konferans Yayını']
                }
            ]);
        }
        
        res.status(200).json(posts);
    } catch (error) {
        console.error('Error fetching public posts:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Yeni eklenen - Ana sayfa için aktif ilanları getiren public endpoint
router.get('/public-active-posts', async (req, res) => {
    try {
        console.log('Public active posts endpoint çağrıldı');
        const currentDate = new Date();

        // Aktif ilanları getir (durum=Açık ve başvuru tarihleri uygun)
        const activePosts = await AcademicPost.find({
            durum: 'Açık',
            basvuru_baslangic_tarihi: { $lte: currentDate },
            basvuru_bitis_tarihi: { $gte: currentDate }
        }).sort({ basvuru_bitis_tarihi: 1 }); // Bitiş tarihine göre sırala
        
        console.log('Bulunan public active posts sayısı:', activePosts.length);
        
        // İlanları döndür
        res.status(200).json(activePosts);
    } catch (error) {
        console.error('Error fetching public active posts:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Adaylar için açık ilanları getiren endpoint
router.get('/get-active-posts', authMiddleware, async (req, res) => {
    try {
        // Adayların sadece açık ilanları görebilmesi için
        const currentDate = new Date();

        // Aktif ilanları getir (durum=Açık ve başvuru tarihleri uygun)
        const activePosts = await AcademicPost.find({
            durum: 'Açık',
            basvuru_baslangic_tarihi: { $lte: currentDate },
            basvuru_bitis_tarihi: { $gte: currentDate }
        }).sort({ basvuru_bitis_tarihi: 1 }); // Bitiş tarihine göre sırala
        
        // İlanları döndür
        res.status(200).json(activePosts);

    } catch (error) {
        // Hataları yönet
        console.error('Error fetching active posts:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// İlana başvuran adayları getir (Yönetici, Jüri ve Admin için)
router.get('/applications-by-post/:postId', authMiddleware, async (req, res) => {
    try {
        // Yetki kontrolü
        if (req.user.rol === 'Aday') {
            return res.status(403).json({
                message: 'Bu işlem için yetkiniz bulunmamaktadır.'
            });
        }

        const postId = req.params.postId;

        // İlanın varlığını kontrol et
        const academicPost = await AcademicPost.findById(postId);
        if (!academicPost) {
            return res.status(404).json({ message: 'İlan bulunamadı.' });
        }

        // Bu ilana yapılan başvuruları bul
        const applications = await Application.find({ ilan_id: postId })
            .populate('aday_id', 'ad soyad tc_kimlik_no') // Sadece gerekli aday bilgilerini getir
            .sort({ 'durum_gecmisi.0.tarih': -1 }); // En son başvurulan ilk sırada

        const result = await Promise.all(applications.map(async (app) => {
            // Her başvuru için belge sayısını getir
            const documentCount = await ApplicationDocument.countDocuments({ application_id: app._id });
            
            return {
                _id: app._id,
                aday: app.aday_id,
                durum: app.durum_gecmisi[0].durum,
                basvuru_tarihi: app.created_at,
                belge_sayisi: documentCount,
                puan: app.puan
            };
        }));

        res.status(200).json(result);

    } catch (error) {
        console.error('Error fetching applications by post:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

router.post('/create-post', authMiddleware, async (req, res) => {
    try {
        // Verify admin role
        if (req.user.rol !== 'Admin') {
            return res.status(403).json({ 
                message: 'Bu işlem için yetkiniz bulunmamaktadır.' 
            });
        }

        // Extract fields from request body
        const { 
            ilan_basligi, 
            ilan_aciklamasi, 
            kademe, 
            basvuru_baslangic_tarihi, 
            basvuru_bitis_tarihi, 
            department,
            fieldGroup,
            required_documents
        } = req.body;

        // Set criteria to fieldGroup if not explicitly provided
        const criteria = req.body.criteria || fieldGroup;

        // Validate required fields
        if (!ilan_basligi || !ilan_aciklamasi || !kademe || !basvuru_baslangic_tarihi || 
            !basvuru_bitis_tarihi || !department || !fieldGroup) {
            return res.status(400).json({
                message: 'Lütfen gerekli tüm alanları doldurun.',
                missingFields: {
                    ilan_basligi: !ilan_basligi,
                    ilan_aciklamasi: !ilan_aciklamasi,
                    kademe: !kademe,
                    basvuru_baslangic_tarihi: !basvuru_baslangic_tarihi,
                    basvuru_bitis_tarihi: !basvuru_bitis_tarihi,
                    department: !department,
                    fieldGroup: !fieldGroup
                }
            });
        }

        // Validate kademe
        const validKademe = ['Dr. Öğr. Üyesi', 'Doçent', 'Profesör'];
        if (!validKademe.includes(kademe)) {
            return res.status(400).json({
                message: 'Geçersiz kademe değeri.'
            });
        }

        // Validate fieldGroup
        const validFieldGroups = ['saglik-fen', 'egitim-sosyal', 'hukuk-ilahiyat', 'guzel-sanatlar'];
        if (!validFieldGroups.includes(fieldGroup)) {
            return res.status(400).json({
                message: 'Geçersiz alan grubu. Lütfen geçerli bir alan grubu seçin.',
                validFieldGroups: validFieldGroups
            });
        }

        // Create academic post object
        const academicPost = new AcademicPost({
            ilan_basligi,
            ilan_aciklamasi,
            kademe,
            basvuru_baslangic_tarihi: new Date(basvuru_baslangic_tarihi),
            basvuru_bitis_tarihi: new Date(basvuru_bitis_tarihi),
            durum: 'Açık',
            created_by: req.user._id,
            required_documents: required_documents || [],
            department,
            fieldGroup,
            criteria,
            applications_count: 0,
            jury_assigned: false,
            is_active: true
        });

        // Save the academic post
        const savedPost = await academicPost.save();

        // Send success response
        res.status(201).json({ 
            message: 'Akademik ilan başarıyla oluşturuldu.',
            ilan: savedPost 
        });

    } catch (error) {
        console.error('İlan oluşturma hatası:', error);
        // Send more detailed error response
        res.status(500).json({ 
            message: 'İlan oluşturulurken bir hata oluştu.',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Silme endpoint'i ekleyelim
router.delete('/delete-post/:id', authMiddleware, async (req, res) => {
    try {
        // Check if user has "Admin" role - only admins can delete posts
        if (req.user.rol !== 'Admin') {
            return res.status(403).json({ 
                message: 'Bu işlem için yetkiniz bulunmamaktadır. Sadece admin kullanıcılar ilanları silebilir.' 
            });
        }

        const postId = req.params.id;

        // Check if the academic post exists
        const academicPost = await AcademicPost.findById(postId);
        if (!academicPost) {
            return res.status(404).json({ 
                message: 'İlan bulunamadı.' 
            });
        }

        // Delete the academic post
        await AcademicPost.findByIdAndDelete(postId);

        // Send success response
        res.status(200).json({
            message: 'Akademik ilan başarıyla silindi.'
        });

    } catch (error) {
        // Handle any errors
        console.error('Error during academic post deletion:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

router.post('/update-post/:id', authMiddleware, async (req, res) => {
    try {
        // Check if user has "Admin" role - only admins can update posts
        if (req.user.rol !== 'Admin') {
            return res.status(403).json({ 
                message: 'Bu işlem için yetkiniz bulunmamaktadır. Sadece yöneticiler ilanları düzenleyebilir.' 
            });
        }

        const postId = req.params.id;

        // Check if the academic post exists
        const academicPost = await AcademicPost.findById(postId);
        if (!academicPost) {
            return res.status(404).json({ 
                message: 'İlan bulunamadı.' 
            });
        }

        // Get data to update from request body
        const { 
            ilan_basligi, 
            ilan_aciklamasi, 
            kademe, 
            basvuru_baslangic_tarihi, 
            basvuru_bitis_tarihi, 
            durum,
            required_documents,
            department,
            fieldGroup 
        } = req.body;

        // Prepare update object with only provided fields
        const updateData = {};
        
        if (ilan_basligi) updateData.ilan_basligi = ilan_basligi;
        if (ilan_aciklamasi) updateData.ilan_aciklamasi = ilan_aciklamasi;
        if (department) updateData.department = department;
        
        // Validate and update fieldGroup if provided
        if (fieldGroup) {
            const validFieldGroups = ['saglik-fen', 'egitim-sosyal', 'hukuk-ilahiyat', 'guzel-sanatlar'];
            if (!validFieldGroups.includes(fieldGroup)) {
                return res.status(400).json({
                    message: 'Geçersiz alan grubu. Lütfen geçerli bir alan grubu seçin.',
                    validFieldGroups: validFieldGroups
                });
            }
            updateData.fieldGroup = fieldGroup;
            
            // Update criteria field to match fieldGroup if not explicitly provided
            if (!req.body.criteria) {
                updateData.criteria = fieldGroup;
            }
        }
        
        // Update criteria if provided explicitly
        if (req.body.criteria) {
            updateData.criteria = req.body.criteria;
        }
        
        // Validate kademe if provided
        if (kademe) {
            const validKademe = ['Dr. Öğr. Üyesi', 'Doçent', 'Profesör'];
            if (!validKademe.includes(kademe)) {
                return res.status(400).json({
                    message: 'Geçersiz kademe değeri. Lütfen "Dr. Öğr. Üyesi", "Doçent" veya "Profesör" değerlerinden birini girin.'
                });
            }
            updateData.kademe = kademe;
        }
        
        if (basvuru_baslangic_tarihi) updateData.basvuru_baslangic_tarihi = new Date(basvuru_baslangic_tarihi);
        if (basvuru_bitis_tarihi) updateData.basvuru_bitis_tarihi = new Date(basvuru_bitis_tarihi);
        
        // Update durum if provided
        if (durum) {
            const validDurum = ['Açık', 'Kapalı', 'Tamamlandı'];
            if (!validDurum.includes(durum)) {
                return res.status(400).json({
                    message: 'Geçersiz durum değeri. Lütfen "Açık", "Kapalı" veya "Tamamlandı" değerlerinden birini girin.'
                });
            }
            updateData.durum = durum;
        }
        
        // Update required_documents if provided
        if (required_documents) updateData.required_documents = required_documents;
        
        // Update the academic post
        const updatedPost = await AcademicPost.findByIdAndUpdate(
            postId,
            updateData,
            { new: true, runValidators: true }
        );
        
        // Send success response
        res.status(200).json({
            message: 'Akademik ilan başarıyla güncellendi.',
            ilan: updatedPost
        });
    } catch (error) {
        console.error('İlan güncelleme hatası:', error);
        res.status(500).json({ 
            message: 'İlan güncellenirken bir hata oluştu.',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Başvurunun özetini getir (puanlar dahil)
router.get('/application-summary/:applicationId', authMiddleware, async (req, res) => {
  try {
    const applicationId = req.params.applicationId;
    
    // Başvuruyu bul
    const application = await Application.findById(applicationId)
      .populate('aday_id', 'ad soyad tc_kimlik_no')
      .populate('ilan_id');
    
    if (!application) {
      return res.status(404).json({ message: 'Başvuru bulunamadı' });
    }
    
    // Erişim kontrolü
    if (req.user.rol === 'Aday' && application.aday_id._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bu başvuruya erişim izniniz yok' });
    }
    
    // Puanları getir
    const applicationPoint = await ApplicationPoint.findOne({ application_id: applicationId });
    
    // Belgeleri getir
    const documents = await ApplicationDocument.find({ application_id: applicationId });
    
    // Belge metadatasını getir
    const documentIds = documents.map(doc => doc._id);
    const metadata = await DocumentMetadata.find({ document_id: { $in: documentIds } });
    
    // Kategori bazında belgeler
    const categoriesData = {};
    
    for (const meta of metadata) {
      const document = documents.find(d => d._id.toString() === meta.document_id.toString());
      
      if (document) {
        // Puan maddesini bul
        const pointItem = await PointItem.findOne({ item_code: meta.item_code });
        
        if (pointItem) {
          if (!categoriesData[pointItem.category_code]) {
            categoriesData[pointItem.category_code] = [];
          }
          
          categoriesData[pointItem.category_code].push({
            document,
            metadata: meta,
            pointItem
          });
        }
      }
    }
    
    // Yanıtı oluştur
    res.status(200).json({
      application,
      applicationPoint,
      categories: categoriesData
    });
  } catch (error) {
    console.error('Başvuru özeti getirme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

// Başvuru durumunu güncelle (jüri ve yönetici)
router.put('/update-application-status/:applicationId', authMiddleware, async (req, res) => {
  try {
    // Yetki kontrolü
    if (req.user.rol !== 'Juri' && req.user.rol !== 'Yonetici' && req.user.rol !== 'Admin') {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
    }
    
    const applicationId = req.params.applicationId;
    const { durum, aciklama } = req.body;
    
    // Durumu kontrol et
    if (!['Beklemede', 'Onaylandı', 'Reddedildi', 'Juri Değerlendirmesinde'].includes(durum)) {
      return res.status(400).json({ message: 'Geçersiz durum değeri' });
    }
    
    // Başvuruyu bul
    const application = await Application.findById(applicationId);
    
    if (!application) {
      return res.status(404).json({ message: 'Başvuru bulunamadı' });
    }
    
    // Durum güncellemesi
    application.durum_gecmisi.unshift({
      durum,
      tarih: new Date(),
      aciklama,
      degistiren: req.user._id
    });
    
    await application.save();
    
    res.status(200).json({
      message: 'Başvuru durumu güncellendi',
      application
    });
  } catch (error) {
    console.error('Başvuru durumu güncelleme hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası', error: error.message });
  }
});

router.post('/apply-dr-ogretim', authMiddleware, upload.array('documents', 20), async (req, res) => {
    try {
        if (req.user.rol !== 'Aday') {
            if (req.files?.length > 0) {
                req.files.forEach(file => fs.unlinkSync(file.path));
            }
            return res.status(403).json({ 
                message: 'Bu işlem için yetkiniz bulunmamaktadır.' 
            });
        }

        const { ilan_id, document_metadata } = req.body;
        if (!ilan_id) {
            return res.status(400).json({ message: 'İlan ID gereklidir.' });
        }

        const metadataArray = JSON.parse(document_metadata);
        if (!Array.isArray(metadataArray) || metadataArray.length !== req.files.length) {
            if (req.files?.length > 0) {
                req.files.forEach(file => fs.unlinkSync(file.path));
            }
            return res.status(400).json({ 
                message: 'Belge metadataları eksik veya hatalı.' 
            });
        }

        const academicPost = await AcademicPost.findById(ilan_id);
        if (!academicPost || academicPost.durum !== 'Açık') {
            if (req.files?.length > 0) {
                req.files.forEach(file => fs.unlinkSync(file.path));
            }
            return res.status(400).json({ 
                message: 'İlan kapalı veya mevcut değil.' 
            });
        }

        const application = new Application({
            ilan_id,
            aday_id: req.user._id,
            durum_gecmisi: [{ 
                durum: 'Beklemede',
                tarih: new Date()
            }]
        });

        await application.save();

        const documentPromises = req.files.map((file, index) => {
            const metadata = metadataArray[index];
            return new ApplicationDocument({
                application_id: application._id,
                belge_tipi: metadata.belge_tipi,
                dosya_yolu: file.path,
                dosya_adi: file.filename,
                dosya_boyutu: file.size,
                metadata: {
                    criteria_id: metadata.criteria_id,
                    author_count: metadata.author_count,
                    author_index: metadata.author_index,
                    is_corresponding_author: metadata.is_corresponding_author,
                    impact_factor: metadata.impact_factor,
                    year: metadata.year,
                    journal: metadata.journal,
                    citation_count: metadata.citation_count,
                    conference_name: metadata.conference_name,
                    conference_type: metadata.conference_type
                }
            }).save();
        });

        await Promise.all(documentPromises);
        await academicPost.updateApplicationsCount();

        res.status(201).json({ 
            message: 'Başvuru başarıyla tamamlandı.',
            application_id: application._id 
        });

    } catch (error) {
        console.error('Başvuru oluşturma hatası:', error);
        if (req.files?.length > 0) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Başvuru durumunu güncelle
router.put('/update-status/:applicationId', authMiddleware, async (req, res) => {
    try {
        if (!['Juri', 'Yonetici', 'Admin'].includes(req.user.rol)) {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
        }

        const { durum, aciklama } = req.body;
        if (!['Beklemede', 'Onaylandı', 'Reddedildi', 'Juri Değerlendirmesinde'].includes(durum)) {
            return res.status(400).json({ message: 'Geçersiz durum değeri' });
        }

        const application = await Application.findById(req.params.applicationId);
        if (!application) {
            return res.status(404).json({ message: 'Başvuru bulunamadı' });
        }

        application.durum_gecmisi.unshift({
            durum,
            tarih: new Date(),
            aciklama
        });

        await application.save();
        res.status(200).json({ message: 'Başvuru durumu güncellendi', application });
    } catch (error) {
        console.error('Durum güncelleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Başvuru detaylarını getir
router.get('/:applicationId', authMiddleware, async (req, res) => {
    try {
        const application = await Application.findById(req.params.applicationId)
            .populate('ilan_id')
            .populate('aday_id', 'ad soyad tc_kimlik_no');

        if (!application) {
            return res.status(404).json({ message: 'Başvuru bulunamadı' });
        }

        if (req.user.rol === 'Aday' && application.aday_id._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Bu başvuruyu görüntüleme yetkiniz yok' });
        }

        const documents = await ApplicationDocument.find({ application_id: application._id });
        
        res.status(200).json({
            application,
            documents
        });
    } catch (error) {
        console.error('Başvuru detayı getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// İlana ait başvuruları getir
router.get('/post/:postId', authMiddleware, async (req, res) => {
    try {
        if (req.user.rol === 'Aday') {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
        }

        const applications = await Application.find({ ilan_id: req.params.postId })
            .populate('aday_id', 'ad soyad tc_kimlik_no')
            .sort({ 'durum_gecmisi.0.tarih': -1 });

        res.status(200).json(applications);
    } catch (error) {
        console.error('İlan başvuruları getirme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Başvuru puanını güncelle
router.put('/update-points/:applicationId', authMiddleware, async (req, res) => {
    try {
        if (!['Juri', 'Yonetici'].includes(req.user.rol)) {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok' });
        }

        const { puan, puan_dagilimi } = req.body;
        const application = await Application.findById(req.params.applicationId);

        if (!application) {
            return res.status(404).json({ message: 'Başvuru bulunamadı' });
        }

        application.puan = puan;
        application.puan_dagilimi = puan_dagilimi;
        await application.save();

        res.status(200).json({ message: 'Puanlar güncellendi', application });
    } catch (error) {
        console.error('Puan güncelleme hatası:', error);
        res.status(500).json({ message: 'Sunucu hatası' });
    }
});

// Get single academic post by ID
router.get('/post-details/:id', authMiddleware, async (req, res) => {
    try {
        const postId = req.params.id;
        
        // Find the academic post
        const academicPost = await AcademicPost.findById(postId);
        
        if (!academicPost) {
            return res.status(404).json({ message: 'İlan bulunamadı.' });
        }
        
        // Return the academic post
        res.status(200).json(academicPost);
    } catch (error) {
        console.error('Error fetching academic post details:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Akademik başvuruyu tamamla ve veritabanına kaydet
router.post('/submit', authMiddleware, async (req, res) => {
    try {
        // Sadece aday rolüne sahip kullanıcılar başvuru yapabilir
        if (req.user.rol !== 'Aday') {
            return res.status(403).json({
                success: false,
                message: 'Bu işlem için yetkiniz bulunmamaktadır. Sadece adaylar başvuru yapabilir.'
            });
        }

        const { academic_post, fieldGroup, kademe, languageExam, publications } = req.body;

        // Zorunlu alanları kontrol et
        if (!academic_post || !fieldGroup || !kademe) {
            return res.status(400).json({
                success: false,
                message: 'Akademik ilan ID, temel alan ve kademe bilgileri zorunludur.'
            });
        }

        // İlan kontrolü
        const academicPost = await AcademicPost.findById(academic_post);
        if (!academicPost || academicPost.durum !== 'Açık') {
            return res.status(400).json({
                success: false,
                message: 'İlan kapalı veya mevcut değil.'
            });
        }

        // Kullanıcının aynı ilana daha önce başvurup başvurmadığını kontrol et
        const existingApplication = await Application.findOne({
            ilan_id: academic_post,
            aday_id: req.user._id
        });

        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: 'Bu ilana zaten başvurdunuz.'
            });
        }

        // Yeni başvuru oluştur
        const application = new Application({
            ilan_id: academic_post,
            aday_id: req.user._id,
            durum_gecmisi: [{
                durum: 'Beklemede',
                tarih: new Date(),
                aciklama: 'Dr. Öğretim Üyesi Başvuru Formundan oluşturuldu'
            }],
            puan_dagilimi: [{
                category: 'Temel Alan',
                criteria: 'Temel Alan',
                points: 0,
                field_group: fieldGroup
            }]
        });

        // Başvuruyu kaydet
        await application.save();

        // Yayınları bu başvuruyla ilişkilendir
        if (publications && publications.length > 0) {
            await Publication.updateMany(
                { _id: { $in: publications } },
                { $set: { application: application._id } }
            );
        }

        // İlanın fieldGroup alanını güncelle
        if (!academicPost.fieldGroup) {
            academicPost.fieldGroup = fieldGroup;
            await academicPost.save();
        }

        // İlan başvuru sayısını güncelle
        await academicPost.updateApplicationsCount();

        res.status(201).json({
            success: true,
            message: 'Başvurunuz başarıyla tamamlandı.',
            application_id: application._id
        });

    } catch (error) {
        console.error('Başvuru tamamlama hatası:', error);
        res.status(500).json({
            success: false,
            message: 'Başvuru tamamlanırken bir hata oluştu.',
            error: error.message
        });
    }
});

module.exports = router;
