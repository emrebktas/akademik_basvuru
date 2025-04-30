const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const Application = require('../db/models/Application');
const ApplicationDocument = require('../db/models/ApplicationDocument');
const AcademicPost = require('../db/models/AcademicPost');
const User = require('../db/models/User');
const Publication = require('../db/models/Publication');
const admin = require('firebase-admin'); // Import Firebase Admin

// Jüri rapor dosyaları için yükleme dizini
const uploadDir = path.join(__dirname, '..', 'uploads', 'juri-raporlari');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Dosya yükleme ayarları
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const fileName = `juri_${req.user._id}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, fileName);
    }
});

// Multer konfigürasyonu
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Sadece PDF dosyalarına izin ver
        if (file.mimetype !== 'application/pdf') {
            return cb(new Error('Sadece PDF dosyaları yüklenebilir!'), false);
        }
        cb(null, true);
    }
});

// Jüri üyesine atanan başvuruları getir
router.get('/assigned-applications', authMiddleware, async (req, res) => {
    try {
        // Jüri rolü kontrolü
        if (req.user.rol !== 'Juri') {
            return res.status(403).json({
                message: 'Bu işlem için yetkiniz bulunmamaktadır. Sadece jüri üyeleri bu sayfaya erişebilir.'
            });
        }

        // Jüri üyesinin atandığı başvuruları bul
        const applications = await Application.find({
            'jury_members.user_id': req.user._id,
            'durum_gecmisi.0.durum': 'Juri Değerlendirmesinde'
        })
        .populate('ilan_id', 'ilan_basligi kademe department basvuru_baslangic_tarihi basvuru_bitis_tarihi')
        .populate('aday_id', 'ad soyad tc_kimlik_no')
        .sort({ 'created_at': -1 });

        res.status(200).json(applications);
    } catch (error) {
        console.error('Error fetching assigned applications:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Başvuru detaylarını getir
router.get('/application/:id', authMiddleware, async (req, res) => {
    try {
        // Jüri rolü kontrolü
        if (req.user.rol !== 'Juri') {
            return res.status(403).json({
                message: 'Bu işlem için yetkiniz bulunmamaktadır.'
            });
        }

        const applicationId = req.params.id;

        // Başvuruyu bul
        const application = await Application.findById(applicationId)
            .populate('ilan_id', 'ilan_basligi kademe department basvuru_baslangic_tarihi basvuru_bitis_tarihi')
            .populate('aday_id', 'ad soyad tc_kimlik_no');

        if (!application) {
            return res.status(404).json({ message: 'Başvuru bulunamadı.' });
        }

        // Jüri üyesinin bu başvuruya atanıp atanmadığını kontrol et
        const isAssigned = application.jury_members.some(member => 
            member.user_id.toString() === req.user._id.toString()
        );

        if (!isAssigned) {
            return res.status(403).json({
                message: 'Bu başvuruya atanmadınız. Sadece atandığınız başvuruları görüntüleyebilirsiniz.'
            });
        }

        // Başvuruya ait belgeleri getir
        const documents = await ApplicationDocument.find({ application_id: applicationId });
        
        // Başvuruya ait yayınları getir
        const publications = await Publication.find({ application: applicationId }).sort({ year: -1 });

        res.status(200).json({
            application,
            documents,
            publications
        });
    } catch (error) {
        console.error('Error fetching application details:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Jüri değerlendirmesi gönder
router.post('/submit-evaluation', authMiddleware, upload.single('report'), async (req, res) => {
    try {
        // Jüri rolü kontrolü
        if (req.user.rol !== 'Juri') {
            // Yüklenen dosyayı sil (varsa)
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(403).json({
                message: 'Bu işlem için yetkiniz bulunmamaktadır.'
            });
        }

        const { applicationId, decision, comments } = req.body;
        
        if (!applicationId || !decision) {
            // Yüklenen dosyayı sil (varsa)
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                message: 'Başvuru ID ve karar bilgileri zorunludur.'
            });
        }

        // Başvuruyu bul
        const application = await Application.findById(applicationId);
        
        if (!application) {
            // Yüklenen dosyayı sil (varsa)
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ message: 'Başvuru bulunamadı.' });
        }

        // Jüri üyesinin bu başvuruya atanıp atanmadığını kontrol et
        const juryMemberIndex = application.jury_members.findIndex(member => 
            member.user_id.toString() === req.user._id.toString()
        );

        if (juryMemberIndex === -1) {
            // Yüklenen dosyayı sil (varsa)
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(403).json({
                message: 'Bu başvuruya atanmadınız.'
            });
        }

        // Jüri üyesinin değerlendirmesini güncelle
        const evaluationUpdate = {
            decision: decision,
            comments: comments || '',
            date: new Date(),
            evaluation_status: 'Tamamlandı'
        };

        // Rapor dosyası yüklendiyse
        if (req.file) {
            evaluationUpdate.report_url = req.file.path;
            evaluationUpdate.report_name = req.file.originalname;
        }

        // Jüri üyesinin değerlendirme durumunu güncelle
        application.jury_members[juryMemberIndex].evaluation = evaluationUpdate;
        application.jury_members[juryMemberIndex].evaluation_status = 'Tamamlandı';

        // Başvuruyu kaydet
        await application.save();

        // Tüm jüri üyeleri değerlendirmeyi tamamladı mı kontrol et
        const allCompleted = application.jury_members.every(member => 
            member.evaluation_status === 'Tamamlandı'
        );

        // Tüm değerlendirmeler tamamlandıysa ve çoğunluk kararı varsa nihai kararı güncelle
        if (allCompleted) {
            const positiveVotes = application.jury_members.filter(
                member => member.evaluation && member.evaluation.decision === 'Olumlu'
            ).length;

            const negativeVotes = application.jury_members.filter(
                member => member.evaluation && member.evaluation.decision === 'Olumsuz'
            ).length;

            // Çoğunluk kararını belirle (eşitlik durumunda olumsuz karar)
            const finalDecision = positiveVotes > negativeVotes ? 'Onaylandı' : 'Reddedildi';

            // Nihai kararı güncelle
            application.final_decision = {
                status: finalDecision,
                date: new Date(),
                explanation: `Jüri değerlendirmesi sonucu ${positiveVotes} olumlu, ${negativeVotes} olumsuz oy ile karar verildi.`
            };

            // Başvuru durumunu güncelle
            application.durum_gecmisi.unshift({
                durum: finalDecision,
                tarih: new Date(),
                aciklama: `Jüri değerlendirmesi tamamlandı. ${positiveVotes} olumlu, ${negativeVotes} olumsuz oy.`
            });

            await application.save();
        }

        res.status(200).json({
            message: 'Değerlendirmeniz başarıyla kaydedildi.',
            allCompleted
        });
    } catch (error) {
        console.error('Error submitting evaluation:', error);
        
        // Yüklenen dosyayı sil (hata durumunda)
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ message: 'Sunucu hatası.', error: error.message });
    }
});

// Rapor dosyasını görüntüle
router.get('/view-report/:applicationId', authMiddleware, async (req, res) => {
    try {
        const { applicationId } = req.params;
        const juryId = req.query.juryId;

        // Başvuruyu bul
        const application = await Application.findById(applicationId);
        
        if (!application) {
            return res.status(404).json({ message: 'Başvuru bulunamadı.' });
        }

        // Jüri üyesini bul
        const juryMember = application.jury_members.find(member => 
            member.user_id.toString() === juryId
        );

        if (!juryMember || !juryMember.evaluation || !juryMember.evaluation.report_url) {
            return res.status(404).json({ message: 'Rapor bulunamadı.' });
        }

        // Dosya erişim kontrolü (yönetici, jüri üyesi veya ilgili jüri üyesi)
        if (req.user.rol !== 'Admin' && req.user.rol !== 'Yonetici' && 
            req.user._id.toString() !== juryId) {
            return res.status(403).json({ message: 'Bu rapora erişim izniniz yok.' });
        }

        // Dosya yolunu al
        const filePath = juryMember.evaluation.report_url;

        // Dosyanın varlığını kontrol et
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Dosya bulunamadı.' });
        }

        // Dosyayı gönder
        res.sendFile(filePath);
    } catch (error) {
        console.error('Error viewing report:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Yayın PDF dosyasını GETIR (Firebase'den)
router.get('/view-publication/:id', authMiddleware, async (req, res) => {
    try {
        // Jüri rolü kontrolü
        if (req.user.rol !== 'Juri' && req.user.rol !== 'Admin' && req.user.rol !== 'Yonetici') {
            return res.status(403).json({
                message: 'Bu işlem için yetkiniz bulunmamaktadır.'
            });
        }

        const publicationId = req.params.id;
        const publication = await Publication.findById(publicationId);
        if (!publication) {
            return res.status(404).json({ message: 'Yayın bulunamadı.' });
        }

        const application = await Application.findById(publication.application);
        if (!application) {
            return res.status(404).json({ message: 'İlgili başvuru bulunamadı.' });
        }

        if (req.user.rol === 'Juri') {
            const isAssigned = application.jury_members.some(member => 
                member.user_id.toString() === req.user._id.toString()
            );
            if (!isAssigned) {
                return res.status(403).json({
                    message: 'Bu başvuruya atanmadınız. Sadece atandığınız başvuruların yayınlarını görüntüleyebilirsiniz.'
                });
            }
        }

        if (!publication.pdfFile) {
            return res.status(404).json({ message: 'Bu yayın için kayıtlı bir PDF yolu (Firebase) bulunamadı.' });
        }

        // --- Get Signed URL from Firebase ---
        let bucket;
        try {
            bucket = admin.storage().bucket();
        } catch (initError) {
            console.error("Error getting storage bucket in /view-publication/:id:", initError);
            return res.status(500).json({ error: 'Depolama hizmetine ulaşılamıyor (init).' });
        }

        if (!bucket) {
            console.error("Firebase bucket reference not available in /view-publication/:id route.");
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

        // Send the signed URL back
        res.json({ 
            success: true, 
            message: "Yayın PDF erişim URL'si oluşturuldu.", 
            pdfUrl: signedUrl 
        });

    } catch (error) {
        console.error(`Error viewing publication (ID: ${req.params.id}):`, error);
        if (error.message && error.message.includes('No such object')) {
            res.status(404).json({ error: 'PDF dosyası Firebase Storage üzerinde bulunamadı.' });
        } else {
            res.status(500).json({ error: "Yayın PDF'si getirilirken bir hata oluştu.", details: error.message });
        }
    }
});

// Başvuru belgesini görüntüle
router.get('/view-document/:documentId', authMiddleware, async (req, res) => {
    try {
        // Jüri rolü kontrolü
        if (req.user.rol !== 'Juri' && req.user.rol !== 'Admin' && req.user.rol !== 'Yonetici') {
            return res.status(403).json({
                message: 'Bu işlem için yetkiniz bulunmamaktadır.'
            });
        }

        const { documentId } = req.params;
        
        // Belgeyi bul
        const document = await ApplicationDocument.findById(documentId);
        
        if (!document) {
            return res.status(404).json({ message: 'Belge bulunamadı.' });
        }
        
        // İlgili başvuruyu bul
        const application = await Application.findById(document.application_id);
        
        if (!application) {
            return res.status(404).json({ message: 'İlgili başvuru bulunamadı.' });
        }
        
        // Eğer kullanıcı jüri üyesi ise, bu başvuruya atanmış olmalı
        if (req.user.rol === 'Juri') {
            const isAssigned = application.jury_members.some(member => 
                member.user_id.toString() === req.user._id.toString()
            );
            
            if (!isAssigned) {
                return res.status(403).json({
                    message: 'Bu başvuruya atanmadınız. Sadece atandığınız başvuruların belgelerini görüntüleyebilirsiniz.'
                });
            }
        }
        
        // Dosya yolunu kontrol et
        if (!document.dosya_yolu) {
            return res.status(404).json({ message: 'Belge dosyası bulunamadı.' });
        }
        
        // Dosyanın fiziksel olarak var olup olmadığını kontrol et
        if (!fs.existsSync(document.dosya_yolu)) {
            return res.status(404).json({ message: 'Dosya fiziksel olarak bulunamadı.' });
        }
        
        // Dosyayı gönder
        res.sendFile(document.dosya_yolu);
    } catch (error) {
        console.error('Error viewing document:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Başvuru belgesini indir
router.get('/download-document/:documentId', authMiddleware, async (req, res) => {
    try {
        // Jüri rolü kontrolü
        if (req.user.rol !== 'Juri' && req.user.rol !== 'Admin' && req.user.rol !== 'Yonetici') {
            return res.status(403).json({
                message: 'Bu işlem için yetkiniz bulunmamaktadır.'
            });
        }

        const { documentId } = req.params;
        
        // Belgeyi bul
        const document = await ApplicationDocument.findById(documentId);
        
        if (!document) {
            return res.status(404).json({ message: 'Belge bulunamadı.' });
        }
        
        // İlgili başvuruyu bul
        const application = await Application.findById(document.application_id);
        
        if (!application) {
            return res.status(404).json({ message: 'İlgili başvuru bulunamadı.' });
        }
        
        // Eğer kullanıcı jüri üyesi ise, bu başvuruya atanmış olmalı
        if (req.user.rol === 'Juri') {
            const isAssigned = application.jury_members.some(member => 
                member.user_id.toString() === req.user._id.toString()
            );
            
            if (!isAssigned) {
                return res.status(403).json({
                    message: 'Bu başvuruya atanmadınız. Sadece atandığınız başvuruların belgelerini indirebilirsiniz.'
                });
            }
        }
        
        // Dosya yolunu kontrol et
        if (!document.dosya_yolu) {
            return res.status(404).json({ message: 'Belge dosyası bulunamadı.' });
        }
        
        // Dosyanın fiziksel olarak var olup olmadığını kontrol et
        if (!fs.existsSync(document.dosya_yolu)) {
            return res.status(404).json({ message: 'Dosya fiziksel olarak bulunamadı.' });
        }
        
        // Dosyayı indir
        res.download(document.dosya_yolu, document.dosya_adi);
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

// Get evaluation statistics for jury member
router.get('/evaluation-stats', authMiddleware, async (req, res) => {
    try {
        // Jüri rolü kontrolü
        if (req.user.rol !== 'Juri') {
            return res.status(403).json({
                message: 'Bu işlem için yetkiniz bulunmamaktadır. Sadece jüri üyeleri bu bilgilere erişebilir.'
            });
        }

        // Jüri üyesinin user_id'si
        const jurorId = req.user._id;

        // Jüri üyesinin atandığı tüm başvuruları bul
        const applications = await Application.find({
            'jury_members.user_id': jurorId,
            'durum_gecmisi.0.durum': 'Juri Değerlendirmesinde'
        });

        // Tamamlanmış değerlendirmeleri say
        let completedCount = 0;
        let pendingCount = 0;

        for (const app of applications) {
            // Bu jüri üyesinin değerlendirmesini bul
            const juryMember = app.jury_members.find(member => 
                member.user_id.toString() === jurorId.toString()
            );
            
            if (juryMember) {
                if (juryMember.evaluation_status === 'Tamamlandı') {
                    completedCount++;
                } else {
                    pendingCount++;
                }
            }
        }

        res.status(200).json({
            total: applications.length,
            completed: completedCount,
            pending: pendingCount
        });
    } catch (error) {
        console.error('Error fetching jury stats:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router; 