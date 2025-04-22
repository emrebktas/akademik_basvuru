const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const auth = require('../middleware/auth'); // Use existing auth middleware
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

// Models
const Publication = require('../db/models/Publication');
const ApplicationCriteria = require('../db/models/ApplicationCriteria');
const User = require('../db/models/User');

// Function to fill in an existing PDF form
router.post('/atama-yonergesi', auth, async (req, res) => {
  try {
    // Get data from request body
    const {
      academic_post,
      fieldGroup,
      personalInfo,
      publications,
      stats,
      criteria,
      totalPoints
    } = req.body;

    // Position adjustment for debugging (pass these as query params if needed)
    const xOffset = parseInt(req.query.xOffset) || 0;
    const yOffset = parseInt(req.query.yOffset) || 0;
    
    // Get user information
    let user = null;
    try {
      user = await User.findById(req.user.id);
    } catch (userError) {
      console.error('User lookup error:', userError);
      // Continue without user data
    }

    // Path to the PDF template
    const templatePath = path.join(__dirname, '../public/templates/atama-yonergesi-24-34.pdf');
    
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({ error: 'PDF şablonu bulunamadı. Lütfen yönetici ile iletişime geçin.' });
    }

    // Load the PDF template
    const templateBuffer = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBuffer);
    
    // Register fontkit to support embedded fonts for Turkish characters
    pdfDoc.registerFontkit(fontkit);
    
    // Load a font that supports Turkish characters
    let customFont;
    try {
      // Try to load Noto Sans font with Turkish character support
      const fontPath = path.join(__dirname, '../public/fonts/NotoSans-Regular.ttf');
      if (fs.existsSync(fontPath)) {
        const fontData = fs.readFileSync(fontPath);
        customFont = await pdfDoc.embedFont(fontData);
        console.log('Using Noto Sans font with Turkish character support');
      } else {
        // Fallback to Helvetica for standard Latin characters
        customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        console.log('Using standard Helvetica font. Some Turkish characters may not display correctly.');
      }
    } catch (fontError) {
      console.error('Font embedding error:', fontError);
      // Fallback to Helvetica
      customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    // Get form fields (if any)
    const form = pdfDoc.getForm();
    
    // Scan the form for fields
    scanFormFields(form);

    // Try to fill form fields if they exist
    let formFieldsFilled = false;
    try {
      // Get all form fields
      const fields = form.getFields();
      console.log(`PDF contains ${fields.length} form fields:`);
      
      // Log all field names for debugging
      fields.forEach(field => {
        const type = field.constructor.name;
        const name = field.getName();
        console.log(`- Field Name: "${name}", Type: ${type}`);
      });
      
      // If there are fields, attempt to fill them
      if (fields.length > 0) {
        formFieldsFilled = true;
        
        // Try to use custom font for form fields if available
        try {
          // Set form appearance options to use our custom font if possible
          form.updateFieldAppearances(customFont);
          console.log('Updated form field appearances with custom font');
        } catch (fontUpdateError) {
          console.error('Failed to update form appearances with custom font:', fontUpdateError);
        }
        
        // Create a map of all possible data values we have
        const dataMap = {
          // Personal information
          'ad_soyad': personalInfo.fullName || (user && user.name) || '',
          'adsoyad': personalInfo.fullName || (user && user.name) || '',
          'fullname': personalInfo.fullName || (user && user.name) || '',
          'name': personalInfo.fullName || (user && user.name) || '',
          'isim': personalInfo.fullName || (user && user.name) || '',
          
          'email': (user && user.email) || '',
          'eposta': (user && user.email) || '',
          'mail': (user && user.email) || '',
          
          'tarih': new Date().toLocaleDateString('tr-TR'),
          'date': new Date().toLocaleDateString('tr-TR'),
          
          'kurum': 'Kocaeli Üniversitesi',
          'universite': 'Kocaeli Üniversitesi',
          'institution': 'Kocaeli Üniversitesi',
          
          'akademik_kadro': academic_post || '',
          'kadro': academic_post || '',
          'position': academic_post || '',
          'academic_position': academic_post || '',
          
          'alan': getFieldGroupName(fieldGroup) || '',
          'temel_alan': getFieldGroupName(fieldGroup) || '',
          'field': getFieldGroupName(fieldGroup) || '',
          'fieldgroup': getFieldGroupName(fieldGroup) || '',
          
          'dil': personalInfo.languageExam || '',
          'dil_sinavi': personalInfo.languageExam || '',
          'yabanci_dil': personalInfo.languageExam || '',
          'language': personalInfo.languageExam || '',
          'language_exam': personalInfo.languageExam || '',
          
          'puan': personalInfo.languageScore || '',
          'dil_puani': personalInfo.languageScore || '',
          'yabanci_dil_puani': personalInfo.languageScore || '',
          'score': personalInfo.languageScore || '',
          'language_score': personalInfo.languageScore || '',
          
          // Statistics
          'toplam_yayin': stats?.totalCount || '0',
          'total_publications': stats?.totalCount || '0',
          'yayin_sayisi': stats?.totalCount || '0',
          
          'a1a2_yayin': stats?.a1a2Count || '0',
          'a1a2_publications': stats?.a1a2Count || '0',
          
          'a1a4_yayin': stats?.a1a4Count || '0',
          'a1a4_publications': stats?.a1a4Count || '0',
          
          'a1a5_yayin': stats?.a1a5Count || '0',
          'a1a5_publications': stats?.a1a5Count || '0',
          
          'ana_yazar': stats?.mainAuthorCount || '0',
          'main_author': stats?.mainAuthorCount || '0',
          
          'toplam_puan': totalPoints || stats?.totalPoints || '0',
          'total_points': totalPoints || stats?.totalPoints || '0',
          
          // Publications might be added as individual fields like pub1, pub2, etc.
          ...generatePublicationFields(publications)
        };
        
        // Function to replace Turkish characters for form fields
        function replaceTurkishChars(text) {
          if (typeof text !== 'string') return text;
          
          return text
            .replace(/ş/g, 's')
            .replace(/Ş/g, 'S')
            .replace(/ğ/g, 'g')
            .replace(/Ğ/g, 'G')
            .replace(/ı/g, 'i')
            .replace(/İ/g, 'I')
            .replace(/ö/g, 'o')
            .replace(/Ö/g, 'O')
            .replace(/ü/g, 'u')
            .replace(/Ü/g, 'U')
            .replace(/ç/g, 'c')
            .replace(/Ç/g, 'C');
        }
        
        // Process all form data to replace Turkish characters
        const processedDataMap = {};
        Object.keys(dataMap).forEach(key => {
          processedDataMap[key] = replaceTurkishChars(dataMap[key]);
        });
        
        // Try to fill each field
        fields.forEach(field => {
          try {
            const fieldName = field.getName().toLowerCase().trim();
            
            // Check if we have data for this field name
            if (processedDataMap[fieldName] !== undefined) {
              if (field.constructor.name === 'PDFTextField') {
                field.setText(String(processedDataMap[fieldName]));
                console.log(`Filled field "${fieldName}" with value: ${processedDataMap[fieldName]}`);
              } else if (field.constructor.name === 'PDFCheckBox' && processedDataMap[fieldName] === true) {
                field.check();
                console.log(`Checked checkbox "${fieldName}"`);
              }
            } else {
              // If exact match fails, try to find a partial match
              const matchingKey = Object.keys(processedDataMap).find(key => 
                fieldName.includes(key) || key.includes(fieldName)
              );
              
              if (matchingKey) {
                if (field.constructor.name === 'PDFTextField') {
                  field.setText(String(processedDataMap[matchingKey]));
                  console.log(`Filled field "${fieldName}" with partial match "${matchingKey}": ${processedDataMap[matchingKey]}`);
                } else if (field.constructor.name === 'PDFCheckBox' && processedDataMap[matchingKey] === true) {
                  field.check();
                  console.log(`Checked checkbox "${fieldName}" with partial match "${matchingKey}"`);
                }
              } else {
                console.log(`No data found for field "${fieldName}"`);
              }
            }
          } catch (fieldError) {
            console.error(`Error filling field ${field.getName()}:`, fieldError);
          }
        });
        
        // Flatten form fields
        form.flatten();
      } else {
        console.log('No form fields found in the PDF. Using text overlay method.');
        formFieldsFilled = false;
      }
    } catch (formError) {
      console.error('Form filling error:', formError);
      formFieldsFilled = false;
    }

    // Get the first page to add text if form fields don't exist or couldn't be filled
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    // Get page dimensions for text positioning
    const { width, height } = firstPage.getSize();
    console.log('PDF dimensions:', width, height);
    
    // Only add text directly if form fields weren't filled successfully
    if (!formFieldsFilled) {
      // Define position mappings for different form fields
      // These are percentage-based positions that should work with most PDF sizes
      // Adding offsets for debugging/adjustment
      const positionMap = {
        // Personal information section - adjust these based on your PDF
        fullName: { x: (width * 0.5) + xOffset, y: (height * 0.8) + yOffset },
        email: { x: (width * 0.5) + xOffset, y: (height * 0.77) + yOffset },
        fieldGroup: { x: (width * 0.5) + xOffset, y: (height * 0.74) + yOffset },
        languageExam: { x: (width * 0.5) + xOffset, y: (height * 0.71) + yOffset },
        languageScore: { x: (width * 0.5) + xOffset, y: (height * 0.68) + yOffset },
        
        // Publication statistics section
        totalPublications: { x: (width * 0.7) + xOffset, y: (height * 0.6) + yOffset },
        a1a2Publications: { x: (width * 0.7) + xOffset, y: (height * 0.57) + yOffset },
        a1a4Publications: { x: (width * 0.7) + xOffset, y: (height * 0.54) + yOffset },
        a1a5Publications: { x: (width * 0.7) + xOffset, y: (height * 0.51) + yOffset },
        mainAuthorCount: { x: (width * 0.7) + xOffset, y: (height * 0.48) + yOffset },
        totalPoints: { x: (width * 0.7) + xOffset, y: (height * 0.45) + yOffset }
      };
      
      // Try to add text to the PDF at the mapped positions
      try {
        // Use custom font for text overlay to support Turkish characters
        // Personal information
        addTextToPdf(firstPage, personalInfo.fullName || (user && user.name) || '', 
                    positionMap.fullName.x, positionMap.fullName.y, 12, customFont);
        addTextToPdf(firstPage, (user && user.email) || '', 
                    positionMap.email.x, positionMap.email.y, 12, customFont);
        addTextToPdf(firstPage, getFieldGroupName(fieldGroup) || '', 
                    positionMap.fieldGroup.x, positionMap.fieldGroup.y, 12, customFont);
        addTextToPdf(firstPage, personalInfo.languageExam || '', 
                    positionMap.languageExam.x, positionMap.languageExam.y, 12, customFont);
        addTextToPdf(firstPage, personalInfo.languageScore || '', 
                    positionMap.languageScore.x, positionMap.languageScore.y, 12, customFont);
        
        // Publication statistics
        if (stats) {
          addTextToPdf(firstPage, String(stats.totalCount || 0), 
                      positionMap.totalPublications.x, positionMap.totalPublications.y, 12, customFont);
          addTextToPdf(firstPage, String(stats.a1a2Count || 0), 
                      positionMap.a1a2Publications.x, positionMap.a1a2Publications.y, 12, customFont);
          addTextToPdf(firstPage, String(stats.a1a4Count || 0), 
                      positionMap.a1a4Publications.x, positionMap.a1a4Publications.y, 12, customFont);
          addTextToPdf(firstPage, String(stats.a1a5Count || 0), 
                      positionMap.a1a5Publications.x, positionMap.a1a5Publications.y, 12, customFont);
          addTextToPdf(firstPage, String(stats.mainAuthorCount || 0), 
                      positionMap.mainAuthorCount.x, positionMap.mainAuthorCount.y, 12, customFont);
          addTextToPdf(firstPage, String(totalPoints || stats.totalPoints || 0), 
                      positionMap.totalPoints.x, positionMap.totalPoints.y, 12, customFont);
        }
      } catch (textError) {
        console.error('Error adding text to PDF:', textError);
      }
      
      // Publications list - Add to first or second page depending on space
      const publicationsPage = pages.length > 1 ? pages[1] : firstPage;
      
      if (Array.isArray(publications) && publications.length > 0) {
        // Starting position for publications list
        let yPosition = pages.length > 1 ? height * 0.9 : height * 0.35;
        const xPosition = (width * 0.1) + xOffset;
        
        publications.forEach((pub, index) => {
          try {
            // Use custom font for publication text to support Turkish characters
            addTextToPdf(publicationsPage, `${index + 1}. ${pub.title || ''}`, 
                        xPosition, yPosition, 11, customFont);
            yPosition -= height * 0.03; // Move down 3% of page height
            
            addTextToPdf(publicationsPage, `Kategori: ${pub.category || '-'}, Indeks: ${pub.index || '-'}, Yil: ${pub.publicationYear || '-'}`, 
                        xPosition + 20, yPosition, 10, customFont);
            yPosition -= height * 0.03;
            
            addTextToPdf(publicationsPage, `DOI: ${pub.doi || '-'}, Ana Yazar: ${pub.isMainAuthor ? 'Evet' : 'Hayir'}`, 
                        xPosition + 20, yPosition, 10, customFont);
            yPosition -= height * 0.04; // Add a bit more space between entries
          } catch (pubError) {
            console.error('Error adding publication to PDF:', pubError);
          }
        });
      }
    }
    
    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    
    // Set headers for the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=atama-yonergesi-24-34.pdf');
    
    // Send the modified PDF
    res.send(Buffer.from(modifiedPdfBytes));
    
  } catch (error) {
    console.error('PDF oluşturma hatası:', error);
    
    // Check if headers have already been sent
    if (!res.headersSent) {
      res.status(500).json({ error: 'PDF oluşturulurken bir hata oluştu.' });
    } else {
      // If headers already sent, we can't send a JSON response
      res.end();
    }
  }
});

// Helper function to get field group name
function getFieldGroupName(fieldGroup) {
  const fieldGroups = {
    'saglik-fen': 'Saglik/Fen/Mat-Muh-Ziraat/Orman/Su Urunleri',
    'egitim-sosyal': 'Egitim/Foloji/Mimarlik-Planlama-Tasarim/SBIB/Spor',
    'hukuk-ilahiyat': 'Hukuk/Ilahiyat',
    'guzel-sanatlar': 'Guzel Sanatlar'
  };
  
  return fieldGroups[fieldGroup] || fieldGroup;
}

// Helper function to scan and log form fields in the PDF
function scanFormFields(form) {
  try {
    const fields = form.getFields();
    console.log(`PDF contains ${fields.length} form fields:`);
    
    fields.forEach(field => {
      const type = field.constructor.name;
      const name = field.getName();
      console.log(`- Field Name: "${name}", Type: ${type}`);
      
      // For text fields, try to get appearance information
      if (type === 'PDFTextField') {
        try {
          const fontName = field.getDefaultAppearance()?.font?.name;
          console.log(`  Font: ${fontName || 'Unknown'}`);
        } catch (err) {
          console.log('  Font info unavailable');
        }
      }
    });
  } catch (error) {
    console.error('Error scanning form fields:', error);
  }
}

// Helper function to generate field mappings for publications
function generatePublicationFields(publications) {
  const fields = {};
  
  if (Array.isArray(publications) && publications.length > 0) {
    // Add individual publication fields with different naming patterns
    publications.forEach((pub, index) => {
      // Common patterns for publication fields
      // Format: pub1, publication1, yayin1, etc.
      const baseNames = ['pub', 'publication', 'yayin', 'makale', 'article'];
      const num = index + 1;
      
      baseNames.forEach(baseName => {
        // Title fields
        fields[`${baseName}${num}`] = pub.title || '';
        fields[`${baseName}${num}_title`] = pub.title || '';
        fields[`${baseName}${num}_baslik`] = pub.title || '';
        
        // Category fields
        fields[`${baseName}${num}_category`] = pub.category || '';
        fields[`${baseName}${num}_kategori`] = pub.category || '';
        
        // Index fields
        fields[`${baseName}${num}_index`] = pub.index || '';
        fields[`${baseName}${num}_indeks`] = pub.index || '';
        
        // Year fields
        fields[`${baseName}${num}_year`] = pub.publicationYear || '';
        fields[`${baseName}${num}_yil`] = pub.publicationYear || '';
        
        // DOI fields
        fields[`${baseName}${num}_doi`] = pub.doi || '';
        
        // Main author fields
        fields[`${baseName}${num}_main_author`] = pub.isMainAuthor ? 'Evet' : 'Hayir';
        fields[`${baseName}${num}_ana_yazar`] = pub.isMainAuthor ? 'Evet' : 'Hayir';
      });
      
      // Also add simple numbered fields
      fields[`title${num}`] = pub.title || '';
      fields[`category${num}`] = pub.category || '';
      fields[`index${num}`] = pub.index || '';
      fields[`year${num}`] = pub.publicationYear || '';
      fields[`doi${num}`] = pub.doi || '';
      fields[`main_author${num}`] = pub.isMainAuthor ? 'Evet' : 'Hayir';
      
      // Turkish versions
      fields[`baslik${num}`] = pub.title || '';
      fields[`kategori${num}`] = pub.category || '';
      fields[`indeks${num}`] = pub.index || '';
      fields[`yil${num}`] = pub.publicationYear || '';
      fields[`ana_yazar${num}`] = pub.isMainAuthor ? 'Evet' : 'Hayir';
    });
    
    // Add a field with all publications as a text list
    let pubListText = '';
    publications.forEach((pub, index) => {
      pubListText += `${index + 1}. ${pub.title || 'Baslik belirtilmemis'}\n`;
      pubListText += `   Kategori: ${pub.category || '-'}, Indeks: ${pub.index || '-'}, Yil: ${pub.publicationYear || '-'}\n`;
      pubListText += `   DOI: ${pub.doi || '-'}, Ana Yazar: ${pub.isMainAuthor ? 'Evet' : 'Hayir'}\n\n`;
    });
    
    fields['publications_list'] = pubListText;
    fields['yayinlar_listesi'] = pubListText;
  }
  
  return fields;
}

// Helper function to add text directly to the PDF
function addTextToPdf(page, text, x, y, fontSize = 10, font, color = rgb(0, 0, 0)) {
  if (!text) return; // Skip empty text
  
  // Ensure we have valid text
  const safeText = String(text || '');
  
  try {
    // First try to use the supplied font directly (which may be Noto Sans)
    page.drawText(safeText, {
      x,
      y,
      size: fontSize,
      font: font,
      color
    });
  } catch (err) {
    console.error('Error adding text with custom font, trying fallback:', err);
    
    // If that fails, use the transliteration approach
    const cleanText = safeText
      .replace(/ş/g, 's')
      .replace(/Ş/g, 'S')
      .replace(/ğ/g, 'g')
      .replace(/Ğ/g, 'G')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'I')
      .replace(/ö/g, 'o')
      .replace(/Ö/g, 'O')
      .replace(/ü/g, 'u')
      .replace(/Ü/g, 'U')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C');
    
    // Try with the cleaned text
    try {
      page.drawText(cleanText, {
        x,
        y,
        size: fontSize,
        font: font,
        color
      });
    } catch (secondErr) {
      console.error('Both text drawing attempts failed:', secondErr);
    }
  }
}

module.exports = router; 