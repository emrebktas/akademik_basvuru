const express = require('express');
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Application = require('../db/models/Application');
const ApplicationDocument = require('../db/models/ApplicationDocument');
const AcademicPost = require('../db/models/AcademicPost');


router.post('/apply', authMiddleware, async (req, res) => {
    try {
        // Check if user has "Aday" role - only candidates can apply
        if (req.user.rol !== 'Aday') {
            return res.status(403).json({ 
                message: 'Bu işlem için yetkiniz bulunmamaktadır. Sadece adaylar başvuru yapabilir.' 
            });
        }

        // Get data from request body and user
        const { ilan_id, documents } = req.body;
        const aday_id = req.user._id; // Get user ID from authenticated user

        // Check if the academic post exists and is open
        const academicPost = await AcademicPost.findById(ilan_id);
        if (!academicPost || academicPost.durum !== 'Açık') {
            return res.status(400).json({ 
                message: 'Başvuru yapılamaz. İlan kapalı veya mevcut değil.' 
            });
        }

        // Create a new application
        const application = new Application({
            ilan_id,          // ID of the academic post
            aday_id,          // ID of the applicant
            durum_gecmisi: [  // Initial status history
                { 
                    durum: 'Beklemede',  // Status set to "Pending"
                    tarih: new Date()    // Current date/time
                }
            ]
        });

        // Save the application to database
        await application.save();

        // Handle document uploads if any
        if (documents && documents.length > 0) {
            const documentPromises = documents.map(doc => {
                return new ApplicationDocument({
                    belge_tipi: doc.belge_tipi,
                    dosya_yolu: doc.dosya_yolu
                }).save();
            });

            // Save all documents in parallel
            await Promise.all(documentPromises);
        }

        // Send success response
        res.status(201).json({ 
            message: 'Başvuru başarıyla tamamlandı.' 
        });

    } catch (error) {
        // Handle any errors
        console.error('Error during application submission:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

router.post('/create-post', authMiddleware, async (req, res) => {
    try {
        // Check if user has "Admin" role - only admins can create posts
        if (req.user.rol !== 'Admin') {
            return res.status(403).json({ 
                message: 'Bu işlem için yetkiniz bulunmamaktadır. Sadece yöneticiler ilan oluşturabilir.' 
            });
        }

        // Get academic post data from request body
        const { 
            ilan_basligi, 
            ilan_aciklamasi, 
            kademe, 
            basvuru_baslangic_tarihi, 
            basvuru_bitis_tarihi, 
            required_documents 
        } = req.body;

        // Validate required fields
        if (!ilan_basligi || !ilan_aciklamasi || !kademe || !basvuru_baslangic_tarihi || !basvuru_bitis_tarihi) {
            return res.status(400).json({
                message: 'Lütfen gerekli tüm alanları doldurun (ilan başlığı, açıklama, kademe, başvuru başlangıç ve bitiş tarihleri).'
            });
        }

        // Validate kademe field
        const validKademe = ['Dr. Öğr. Üyesi', 'Doçent', 'Profesör'];
        if (!validKademe.includes(kademe)) {
            return res.status(400).json({
                message: 'Geçersiz kademe değeri. Lütfen "Dr. Öğr. Üyesi", "Doçent" veya "Profesör" değerlerinden birini girin.'
            });
        }

        // Validate required_documents
        if (required_documents && !Array.isArray(required_documents)) {
            return res.status(400).json({
                message: 'required_documents must be an array.'
            });
        }

        // Validate document types if provided
        const validDocumentTypes = ['İndeksli Yayın', 'Atıf Sayısı', 'Konferans Yayını'];
        if (required_documents && required_documents.length > 0) {
            const invalidDocuments = required_documents.filter(doc => !validDocumentTypes.includes(doc));
            if (invalidDocuments.length > 0) {
                return res.status(400).json({
                    message: `Geçersiz belge türleri: ${invalidDocuments.join(', ')}. Geçerli değerler: ${validDocumentTypes.join(', ')}`
                });
            }
        }

        // Create a new academic post
        const academicPost = new AcademicPost({
            ilan_basligi,
            ilan_aciklamasi,
            kademe,
            basvuru_baslangic_tarihi: new Date(basvuru_baslangic_tarihi),
            basvuru_bitis_tarihi: new Date(basvuru_bitis_tarihi),
            durum: 'Açık', // Default status is open
            created_by: req.user._id,
            required_documents: required_documents || []
        });

        // Save the academic post to database
        await academicPost.save();

        // Send success response
        res.status(201).json({ 
            message: 'Akademik ilan başarıyla oluşturuldu.',
            ilan_id: academicPost._id 
        });

    } catch (error) {
        // Handle any errors
        console.error('Error during academic post creation:', error);
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
            required_documents 
        } = req.body;

        // Prepare update object with only provided rs
        const updateData = {};
        
        if (ilan_basligi) updateData.ilan_basligi = ilan_basligi;
        if (ilan_aciklamasi) updateData.ilan_aciklamasi = ilan_aciklamasi;
        
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
        
        // Validate durum if provided
        if (durum) {
            const validDurum = ['Açık', 'Kapalı', 'Tamamlandı'];
            if (!validDurum.includes(durum)) {
                return res.status(400).json({
                    message: 'Geçersiz durum değeri. Lütfen "Açık", "Kapalı" veya "Tamamlandı" değerlerinden birini girin.'
                });
            }
            updateData.durum = durum;
        }
        
        // Validate required_documents if provided
        if (required_documents) {
            const validDocumentTypes = ['İndeksli Yayın', 'Atıf Sayısı', 'Konferans Yayını'];
            const invalidDocuments = required_documents.filter(doc => !validDocumentTypes.includes(doc));
            if (invalidDocuments.length > 0) {
                return res.status(400).json({
                    message: `Geçersiz belge türleri: ${invalidDocuments.join(', ')}. Geçerli değerler: ${validDocumentTypes.join(', ')}`
                });
            }
            updateData.required_documents = required_documents;
        }

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
        // Handle any errors
        console.error('Error during academic post update:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;
