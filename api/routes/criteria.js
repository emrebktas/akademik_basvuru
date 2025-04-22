const express = require('express');
const router = express.Router();
const ApplicationCriteria = require('../db/models/ApplicationCriteria');
const authMiddleware = require('../middleware/auth');

// Tüm kriterleri getir
router.get('/', authMiddleware, async (req, res) => {
  try {
    const criteria = await ApplicationCriteria.find();
    res.status(200).json(criteria);
  } catch (error) {
    console.error('Kriterleri getirme hatası:', error);
    res.status(500).json({
      error: 'Kriterler getirilemedi',
      details: error.message
    });
  }
});

// Belirli bir alan grubunun kriterlerini getir
router.get('/:fieldGroup', authMiddleware, async (req, res) => {
  try {
    const fieldGroup = req.params.fieldGroup;
    const criteria = await ApplicationCriteria.findOne({ fieldGroup });
    
    if (!criteria) {
      return res.status(404).json({
        error: 'Bu alan grubu için kriter bulunamadı',
        fieldGroup
      });
    }
    
    res.status(200).json(criteria);
  } catch (error) {
    console.error('Alan grubu kriteri getirme hatası:', error);
    res.status(500).json({
      error: 'Kriterler getirilemedi',
      details: error.message
    });
  }
});

// Kriterleri oluştur/güncelle (sadece admin)
router.post('/create', authMiddleware, async (req, res) => {
  try {
    if (req.user.rol !== 'Admin' && req.user.rol !== 'Yonetici') {
      return res.status(403).json({
        error: 'Bu işlem için yetkiniz yok'
      });
    }
    
    // Varsayılan kriterleri oluştur
    await ApplicationCriteria.createDefaultCriteria();
    
    const allCriteria = await ApplicationCriteria.find();
    res.status(200).json({
      message: 'Kriterler başarıyla oluşturuldu/güncellendi',
      criteria: allCriteria
    });
  } catch (error) {
    console.error('Kriter oluşturma hatası:', error);
    res.status(500).json({
      error: 'Kriterler oluşturulamadı',
      details: error.message
    });
  }
});

// Belirli bir alan grubunun kriterlerini güncelle (sadece admin)
router.put('/:fieldGroup', authMiddleware, async (req, res) => {
  try {
    if (req.user.rol !== 'Admin' && req.user.rol !== 'Yonetici') {
      return res.status(403).json({
        error: 'Bu işlem için yetkiniz yok'
      });
    }
    
    const fieldGroup = req.params.fieldGroup;
    const updateData = req.body;
    
    // fieldGroup değiştirilemez
    delete updateData.fieldGroup;
    
    const updatedCriteria = await ApplicationCriteria.findOneAndUpdate(
      { fieldGroup },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedCriteria) {
      return res.status(404).json({
        error: 'Bu alan grubu için kriter bulunamadı',
        fieldGroup
      });
    }
    
    res.status(200).json({
      message: 'Kriterler başarıyla güncellendi',
      criteria: updatedCriteria
    });
  } catch (error) {
    console.error('Kriter güncelleme hatası:', error);
    res.status(500).json({
      error: 'Kriterler güncellenemedi',
      details: error.message
    });
  }
});

module.exports = router; 