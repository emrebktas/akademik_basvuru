const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const AcademicPost = require('../db/models/AcademicPost');
const PositionCriteria = require('../db/models/PositionCriteria');
const Jury = require('../db/models/Jury');
const Evaluation = require('../db/models/Evaluation');
const User = require('../db/models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const Application = require('../db/models/Application');
const mongoose = require('mongoose');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/table5';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `table5-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });


// 1. Dashboard and Statistics
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {   
        if (req.user.rol !== 'Yonetici') {
            return res.status(403).json({ error: 'Bu işlem için Yönetici yetkisi gereklidir' });
        }

        const totalPosts = await AcademicPost.countDocuments();
        const totalApplications = await Application.countDocuments();
        const pendingApplications = await Application.countDocuments({ 
            'durum_gecmisi.0.durum': 'Beklemede' 
        });
        const applicationsInJury = await Application.countDocuments({ 
            'durum_gecmisi.0.durum': 'Juri Değerlendirmesinde' 
        });

        res.json({
            totalPosts,
            totalApplications,
            pendingApplications,
            applicationsInJury
        });
    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        res.status(500).json({ error: 'İstatistikler alınırken bir hata oluştu' });
    }
});

// Get all posts (for administrators)
router.get('/posts', authMiddleware, async (req, res) => {
    try {
        if (req.user.rol !== 'Yonetici' && req.user.rol !== 'Admin') {
            return res.status(403).json({ error: 'Bu işlem için yetkiniz bulunmamaktadır' });
        }

        const posts = await AcademicPost.find()
            .populate('created_by', 'rol')
            .sort({ created_at: -1 });

        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ 
            error: 'İlanlar alınırken bir hata oluştu',
            details: error.message 
        });
    }
});

// 2. Position Criteria Management
router.post('/criteria', authMiddleware, async (req, res) => {
    try {
        if (req.user.rol !== 'Yonetici') {
            return res.status(403).json({ error: 'Bu işlem için Yönetici yetkisi gereklidir' });
        }

        const { position_type, criteria, total_minimum_points } = req.body;
        
        const newCriteria = new PositionCriteria({
            position_type,
            criteria,
            total_minimum_points,
            created_by: req.user._id
        });

        await newCriteria.save();
        res.status(201).json(newCriteria);
    } catch (error) {
        console.error('Error creating criteria:', error);
        res.status(500).json({ error: 'Kriter oluşturulurken bir hata oluştu' });
    }
});

router.get('/criteria', authMiddleware, async (req, res) => {
    try {
        if (req.user.rol !== 'Yonetici') {
            return res.status(403).json({ error: 'Bu işlem için Yönetici yetkisi gereklidir' });
        }

        console.log('Fetching criteria...');
        const criteria = await PositionCriteria.find()
            .populate('created_by', 'rol')
            .select('-__v');

        console.log('Found criteria:', criteria);
        
        if (!criteria || criteria.length === 0) {
            return res.status(200).json([]); // Return empty array instead of error
        }

        res.json(criteria);
    } catch (error) {
        console.error('Error fetching criteria:', error);
        res.status(500).json({ 
            error: 'Kriterler alınırken bir hata oluştu',
            details: error.message 
        });
    }
});

router.put('/criteria/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.rol !== 'Yonetici') {
            return res.status(403).json({ error: 'Bu işlem için Yönetici yetkisi gereklidir' });
        }

        const { id } = req.params;
        const { criteria, total_minimum_points } = req.body;

        const updatedCriteria = await PositionCriteria.findByIdAndUpdate(
            id,
            { 
                criteria,
                total_minimum_points,
                updated_at: new Date()
            },
            { new: true }
        );

        if (!updatedCriteria) {
            return res.status(404).json({ error: 'Kriter bulunamadı' });
        }

        res.json(updatedCriteria);
    } catch (error) {
        console.error('Error updating criteria:', error);
        res.status(500).json({ error: 'Kriter güncellenirken bir hata oluştu' });
    }
});

// 3. Application Management
router.get('/posts/:postId/applications', authMiddleware, async (req, res) => {
    try {
        if (req.user.rol !== 'Yonetici') {
            return res.status(403).json({ error: 'Bu işlem için Yönetici yetkisi gereklidir' });
        }

        const { postId } = req.params;
        
        // Find all applications for this post
        const applications = await Application.find({ ilan_id: postId })
            .populate('aday_id', 'ad soyad tc_kimlik_no')
            .sort({ created_at: -1 });
        
        // Get documents for these applications separately
        const applicationIds = applications.map(app => app._id);
        const documents = await mongoose.model('application_document').find({
            application_id: { $in: applicationIds }
        });
        
        // Organize documents by application
        const docsMap = {};
        documents.forEach(doc => {
            if (!docsMap[doc.application_id]) {
                docsMap[doc.application_id] = [];
            }
            docsMap[doc.application_id].push(doc);
        });
        
        // Attach documents to each application
        const applicationsWithDocs = applications.map(app => {
            const appObj = app.toObject();
            appObj.belgeler = docsMap[app._id] || [];
            return appObj;
        });

        res.json(applicationsWithDocs);
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ error: 'Başvurular alınırken bir hata oluştu' });
    }
});

// 4. Jury Management
router.post('/jury', authMiddleware, async (req, res) => {
    try {
        if (req.user.rol !== 'Yonetici') {
            return res.status(403).json({ error: 'Bu işlem için Yönetici yetkisi gereklidir' });
        }

        const { postId, juryMembers } = req.body;

        // Validate jury members
        if (juryMembers.length !== 5) {
            return res.status(400).json({ error: 'Jüri üye sayısı 5 olmalıdır' });
        }

        // Check if all members exist
        const memberIds = juryMembers.map(member => member.user_id);
        const existingMembers = await User.find({ _id: { $in: memberIds } });
        
        if (existingMembers.length !== 5) {
            return res.status(400).json({ error: 'Bazı jüri üyeleri bulunamadı' });
        }

        // Create jury assignment
        const newJury = new Jury({
            post_id: postId,
            members: juryMembers,
            created_by: req.user._id
        });

        await newJury.save();

        // Update application status
        await Application.updateMany(
            { ilan_id: postId },
            { 
                $push: { 
                    durum_gecmisi: { 
                        durum: 'Juri Değerlendirmesinde',
                        tarih: new Date()
                    }
                }
            }
        );

        res.status(201).json(newJury);
    } catch (error) {
        console.error('Error assigning jury:', error);
        res.status(500).json({ error: 'Jüri atanırken bir hata oluştu' });
    }
});

// 5. Table 5 PDF Generation
router.get('/applications/:applicationId/table5', authMiddleware, async (req, res) => {
    try {
        if (req.user.rol !== 'Yonetici') {
            return res.status(403).json({ error: 'Bu işlem için Yönetici yetkisi gereklidir' });
        }

        const { applicationId } = req.params;
        
        const application = await Application.findById(applicationId)
            .populate('aday_id', 'ad soyad tc_kimlik_no dogum_yili')
            .populate('ilan_id', 'ilan_basligi kademe');

        if (!application) {
            return res.status(404).json({ error: 'Başvuru bulunamadı' });
        }

        // Create PDF document
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=tablo5-${applicationId}.pdf`);
        
        // Pipe the PDF to the response
        doc.pipe(res);
        
        // Add content to PDF
        doc.fontSize(16).text('TABLO 5 - AKADEMİK BAŞVURU PUAN TABLOSU', { align: 'center' });
        doc.moveDown();
        
        // Add candidate information
        doc.fontSize(12).text(`Aday: ${application.aday_id.ad} ${application.aday_id.soyad}`);
        doc.text(`TC Kimlik No: ${application.aday_id.tc_kimlik_no}`);
        doc.text(`Doğum Yılı: ${application.aday_id.dogum_yili}`);
        doc.text(`İlan: ${application.ilan_id.ilan_basligi}`);
        doc.text(`Kademe: ${application.ilan_id.kademe}`);
        doc.text(`Toplam Puan: ${application.puan || 0}`);
        doc.moveDown(2);
        
        // Add points breakdown
        doc.fontSize(14).text('PUAN DAĞILIMI', { underline: true });
        doc.moveDown();
        
        if (application.puan_dagilimi && application.puan_dagilimi.length > 0) {
            let currentCategory = '';
            let categoryTotal = 0;
            
            application.puan_dagilimi.forEach((item, index) => {
                if (item.category !== currentCategory) {
                    if (currentCategory !== '') {
                        doc.fontSize(11).text(`${currentCategory} Toplam: ${categoryTotal} puan`, { indent: 20 });
                        doc.moveDown();
                        categoryTotal = 0;
                    }
                    currentCategory = item.category;
                    doc.fontSize(12).text(currentCategory, { underline: true });
                }
                
                doc.fontSize(10).text(`${index + 1}. ${item.criteria}: ${item.points} puan`, { indent: 10 });
                categoryTotal += item.points;
            });
            
            if (currentCategory !== '') {
                doc.fontSize(11).text(`${currentCategory} Toplam: ${categoryTotal} puan`, { indent: 20 });
            }
        } else {
            doc.text('Bu başvuru için puan dağılımı bulunmamaktadır.');
        }
        
        // Add a signature area
        doc.moveDown(4);
        doc.fontSize(12).text('Değerlendirme Tarihi: _________________', { align: 'right' });
        doc.moveDown();
        doc.text('İmza: _________________', { align: 'right' });
        
        // Finalize the PDF
        doc.end();
    } catch (error) {
        console.error('Error generating Table 5:', error);
        res.status(500).json({ error: 'Tablo 5 oluşturulurken bir hata oluştu' });
    }
});

// 6. User Management (for jury members)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({ rol: { $in: ['Juri', 'Yonetici', 'Admin'] } })
      .select('ad soyad email tc_kimlik_no rol department');
    
    const formattedUsers = users.map(user => ({
      _id: user._id,
      name: `${user.ad} ${user.soyad}`,
      email: user.email,
      tc_kimlik_no: user.tc_kimlik_no,
      role: user.rol,
      department: user.department
    }));
    
    res.json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Kullanıcılar alınırken bir hata oluştu' });
  }
});

module.exports = router;
