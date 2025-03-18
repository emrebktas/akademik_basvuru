const express = require('express');
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Application = require('../db/models/Application');
const ApplicationDocument = require('../db/models/ApplicationDocument');
const AcademicPost = require('../db/models/AcademicPost');

router.post('/apply', authMiddleware, async (req, res) => {
    try {
        const { ilan_id, documents } = req.body;
        const aday_id = req.user._id; // Assuming the user ID is stored in req.user

        // Check if the academic post is open for applications
        const academicPost = await AcademicPost.findById(ilan_id);
        if (!academicPost || academicPost.durum !== 'Açık') {
            return res.status(400).json({ message: 'Başvuru yapılamaz. İlan kapalı veya mevcut değil.' });
        }

        // Create a new application
        const application = new Application({
            ilan_id,
            aday_id,
            durum_gecmisi: [{ durum: 'Beklemede', tarih: new Date() }]
        });

        await application.save();

        // Handle documents
        if (documents && documents.length > 0) {
            const documentPromises = documents.map(doc => {
                return new ApplicationDocument({
                    application_id: application._id,
                    belge_tipi: doc.belge_tipi,
                    dosya_yolu: doc.dosya_yolu
                }).save();
            });

            await Promise.all(documentPromises);
        }

        res.status(201).json({ message: 'Başvuru başarıyla tamamlandı.' });
    } catch (error) {
        console.error('Error during application submission:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
});

module.exports = router;
