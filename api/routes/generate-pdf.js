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
      kademe,
      personalInfo,
      publications,
      stats,
      criteria,
      totalPoints
    } = req.body;

    // Log the kademe value for debugging
    console.log(`Kademe value from request: ${kademe || 'Not provided'}`);
    console.log(`Kademe value normalized: ${kademe?.toLowerCase()}`);
    
    // Enhanced debugging for Dr. Öğr. Üyesi specifically
    const isDrOgrUyesi = kademe?.toLowerCase().includes('dr') || kademe?.toLowerCase().includes('öğr');
    console.log(`Is Dr. Öğr. Üyesi detected: ${isDrOgrUyesi ? 'YES' : 'NO'}`);

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

    // Process publications to ensure points are included
    let processedPublications = publications;
    
    // Add logging for the academic position
    console.log(`Academic position from request: ${academic_post || 'Not provided'}`);    
    // If publications are IDs or don't have points, fetch them from the database
    if (Array.isArray(publications) && publications.length > 0 && !publications[0].points) {
      try {
        // Check if publications array contains database IDs or publication objects
        if (typeof publications[0] === 'string' || publications[0]._id) {
          // Fetch publications from database to get full data including points
          const publicationIds = publications.map(pub => 
            typeof pub === 'string' ? pub : pub._id
          );
          
          processedPublications = await Publication.find({
            _id: { $in: publicationIds }
          });
          
          console.log('Fetched publications with points from database:', processedPublications.length);
        } else {
          // Publications don't have points but are full objects
          // Calculate points based on index values
          processedPublications = publications.map(pub => {
            // Apply the same logic as in Publication model pre-save hook
            const pointValues = {
              'Q1': 60,
              'Q2': 55,
              'Q3': 40,
              'Q4': 30,
              'ESCI': 25,
              'Scopus': 20,
              'Uluslararası Diğer': 15,
              'TR Dizin': 10,
              'Ulusal Hakemli': 8
            };
            
            return {
              ...pub,
              points: pointValues[pub.index] || 0
            };
          });
          
          console.log('Calculated points for publications:', processedPublications.length);
        }
      } catch (pubError) {
        console.error('Error processing publications:', pubError);
        // Continue with original publications data
        processedPublications = publications;
      }
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
          
          'akademik_kadro': kademe || academic_post || '',
          'kadro': kademe || academic_post || '',
          'position': kademe || academic_post || '',
          'academic_position': kademe || academic_post || '',
          
          // Detect academic position type using the kademe value
          'position_type': kademe?.toLowerCase() === 'dr. öğr. üyesi' ? 'assistant_professor' : kademe?.toLowerCase() === 'doçent' ? 'associate_professor' : kademe?.toLowerCase() === 'profesör' ? 'professor' : 'unknown',
          
          // Academic position checkboxes based on kademe value with more variations
          'drogr_uyesi': kademe?.toLowerCase().includes('dr') || kademe?.toLowerCase().includes('öğr') ? true : false,
          'doktor_ogretim_uyesi': kademe?.toLowerCase().includes('dr') || kademe?.toLowerCase().includes('öğr') ? true : false,
          'dr_ogretim_uyesi': kademe?.toLowerCase().includes('dr') || kademe?.toLowerCase().includes('öğr') ? true : false,
          'dou': kademe?.toLowerCase().includes('dr') || kademe?.toLowerCase().includes('öğr') ? true : false,
          'dr': kademe?.toLowerCase().includes('dr') || kademe?.toLowerCase().includes('öğr') ? true : false,
          'dr_ogr': kademe?.toLowerCase().includes('dr') || kademe?.toLowerCase().includes('öğr') ? true : false,
          'drogr': kademe?.toLowerCase().includes('dr') || kademe?.toLowerCase().includes('öğr') ? true : false,
          
          'docent': kademe?.toLowerCase().includes('doç') || kademe?.toLowerCase().includes('doçent') ? true : false,
          'doc': kademe?.toLowerCase().includes('doç') || kademe?.toLowerCase().includes('doçent') ? true : false,
          'doç': kademe?.toLowerCase().includes('doç') || kademe?.toLowerCase().includes('doçent') ? true : false,
          'doçent': kademe?.toLowerCase().includes('doç') || kademe?.toLowerCase().includes('doçent') ? true : false,
          'docdr': kademe?.toLowerCase().includes('doç') || kademe?.toLowerCase().includes('doçent') ? true : false,
          
          'profesor': kademe?.toLowerCase().includes('prof') || kademe?.toLowerCase().includes('profesör') ? true : false,
          'prof': kademe?.toLowerCase().includes('prof') || kademe?.toLowerCase().includes('profesör') ? true : false,
          'profesör': kademe?.toLowerCase().includes('prof') || kademe?.toLowerCase().includes('profesör') ? true : false,
          'profdr': kademe?.toLowerCase().includes('prof') || kademe?.toLowerCase().includes('profesör') ? true : false,
          
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
          
          // Doğrudan makale başlık ve puanlarını da ekleyelim
          'makale_basliklari': processedPublications?.map(pub => pub.title).join(', ') || '',
          'article_titles': processedPublications?.map(pub => pub.title).join(', ') || '',
          'makale_puanlari': processedPublications?.map(pub => pub.points).join(', ') || '',
          'article_points': processedPublications?.map(pub => pub.points).join(', ') || '',
          
          // Add direct mappings for category-specific titles
          'a1_makale': processedPublications?.filter(pub => pub.category === 'A1').map(pub => pub.title).join(', ') || '',
          'a2_makale': processedPublications?.filter(pub => pub.category === 'A2').map(pub => pub.title).join(', ') || '',
          'a3_makale': processedPublications?.filter(pub => pub.category === 'A3').map(pub => pub.title).join(', ') || '',
          'a4_makale': processedPublications?.filter(pub => pub.category === 'A4').map(pub => pub.title).join(', ') || '',
          'a5_makale': processedPublications?.filter(pub => pub.category === 'A5').map(pub => pub.title).join(', ') || '',
          'a6_makale': processedPublications?.filter(pub => pub.category === 'A6').map(pub => pub.title).join(', ') || '',
          'a7_makale': processedPublications?.filter(pub => pub.category === 'A7').map(pub => pub.title).join(', ') || '',
          'a8_makale': processedPublications?.filter(pub => pub.category === 'A8').map(pub => pub.title).join(', ') || '',
          
          // Add direct mappings for category-specific points
          'a1_makale_puan': processedPublications?.filter(pub => pub.category === 'A1').map(pub => pub.points).join(', ') || '',
          'a2_makale_puan': processedPublications?.filter(pub => pub.category === 'A2').map(pub => pub.points).join(', ') || '',
          'a3_makale_puan': processedPublications?.filter(pub => pub.category === 'A3').map(pub => pub.points).join(', ') || '',
          'a4_makale_puan': processedPublications?.filter(pub => pub.category === 'A4').map(pub => pub.points).join(', ') || '',
          'a5_makale_puan': processedPublications?.filter(pub => pub.category === 'A5').map(pub => pub.points).join(', ') || '',
          'a6_makale_puan': processedPublications?.filter(pub => pub.category === 'A6').map(pub => pub.points).join(', ') || '',
          'a7_makale_puan': processedPublications?.filter(pub => pub.category === 'A7').map(pub => pub.points).join(', ') || '',
          'a8_makale_puan': processedPublications?.filter(pub => pub.category === 'A8').map(pub => pub.points).join(', ') || '',
          
          // Add total points per category
          'a1_toplam_puan': processedPublications?.filter(pub => pub.category === 'A1').reduce((sum, pub) => sum + (pub.points || 0), 0) || '0',
          'a2_toplam_puan': processedPublications?.filter(pub => pub.category === 'A2').reduce((sum, pub) => sum + (pub.points || 0), 0) || '0',
          'a3_toplam_puan': processedPublications?.filter(pub => pub.category === 'A3').reduce((sum, pub) => sum + (pub.points || 0), 0) || '0',
          'a4_toplam_puan': processedPublications?.filter(pub => pub.category === 'A4').reduce((sum, pub) => sum + (pub.points || 0), 0) || '0',
          'a5_toplam_puan': processedPublications?.filter(pub => pub.category === 'A5').reduce((sum, pub) => sum + (pub.points || 0), 0) || '0',
          'a6_toplam_puan': processedPublications?.filter(pub => pub.category === 'A6').reduce((sum, pub) => sum + (pub.points || 0), 0) || '0',
          'a7_toplam_puan': processedPublications?.filter(pub => pub.category === 'A7').reduce((sum, pub) => sum + (pub.points || 0), 0) || '0',
          'a8_toplam_puan': processedPublications?.filter(pub => pub.category === 'A8').reduce((sum, pub) => sum + (pub.points || 0), 0) || '0',
          
          // Add direct mappings for index-specific titles
          'q1_makale': processedPublications?.filter(pub => pub.index === 'Q1').map(pub => pub.title).join(', ') || '',
          'q2_makale': processedPublications?.filter(pub => pub.index === 'Q2').map(pub => pub.title).join(', ') || '',
          'q3_makale': processedPublications?.filter(pub => pub.index === 'Q3').map(pub => pub.title).join(', ') || '',
          'q4_makale': processedPublications?.filter(pub => pub.index === 'Q4').map(pub => pub.title).join(', ') || '',
          'esci_makale': processedPublications?.filter(pub => pub.index === 'ESCI').map(pub => pub.title).join(', ') || '',
          'scopus_makale': processedPublications?.filter(pub => pub.index === 'Scopus').map(pub => pub.title).join(', ') || '',
          'trdizin_makale': processedPublications?.filter(pub => pub.index === 'TR Dizin').map(pub => pub.title).join(', ') || '',
          
          // Add direct mappings for index-specific points
          'q1_makale_puan': processedPublications?.filter(pub => pub.index === 'Q1').map(pub => pub.points).join(', ') || '',
          'q2_makale_puan': processedPublications?.filter(pub => pub.index === 'Q2').map(pub => pub.points).join(', ') || '',
          'q3_makale_puan': processedPublications?.filter(pub => pub.index === 'Q3').map(pub => pub.points).join(', ') || '',
          'q4_makale_puan': processedPublications?.filter(pub => pub.index === 'Q4').map(pub => pub.points).join(', ') || '',
          'esci_makale_puan': processedPublications?.filter(pub => pub.index === 'ESCI').map(pub => pub.points).join(', ') || '',
          'scopus_makale_puan': processedPublications?.filter(pub => pub.index === 'Scopus').map(pub => pub.points).join(', ') || '',
          'trdizin_makale_puan': processedPublications?.filter(pub => pub.index === 'TR Dizin').map(pub => pub.points).join(', ') || '',
          
          // Add total points per index
          'q1_toplam_puan': processedPublications?.filter(pub => pub.index === 'Q1').reduce((sum, pub) => sum + (pub.points || 0), 0) || '0',
          'q2_toplam_puan': processedPublications?.filter(pub => pub.index === 'Q2').reduce((sum, pub) => sum + (pub.points || 0), 0) || '0',
          'q3_toplam_puan': processedPublications?.filter(pub => pub.index === 'Q3').reduce((sum, pub) => sum + (pub.points || 0), 0) || '0',
          'q4_toplam_puan': processedPublications?.filter(pub => pub.index === 'Q4').reduce((sum, pub) => sum + (pub.points || 0), 0) || '0',
          'esci_toplam_puan': processedPublications?.filter(pub => pub.index === 'ESCI').reduce((sum, pub) => sum + (pub.points || 0), 0) || '0',
          'scopus_toplam_puan': processedPublications?.filter(pub => pub.index === 'Scopus').reduce((sum, pub) => sum + (pub.points || 0), 0) || '0',
          'trdizin_toplam_puan': processedPublications?.filter(pub => pub.index === 'TR Dizin').reduce((sum, pub) => sum + (pub.points || 0), 0) || '0',
          
          // Add direct mappings for individual category publications
          ...getIndividualCategoryPublications(processedPublications),
          
          // Add direct mappings for individual index publications
          ...getIndividualIndexPublications(processedPublications),
          
          // Publications might be added as individual fields like pub1, pub2, etc.
          ...generatePublicationFields(processedPublications)
        };
        
        // Enhanced debug: Log all form field names from the PDF
        console.log("==== All form field names in PDF ====");
        fields.forEach(field => {
          console.log(`Field name: ${field.getName()}, Type: ${field.constructor.name}`);
        });
        console.log("==== End of field list ====");
        
        // Track if we successfully checked the Dr. Öğr. Üyesi checkbox
        let drOgrUyesiChecked = false;
        
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
            
            // Enhanced debug for Dr. Öğr. Üyesi related fields
            if (fieldName.includes('dr') || fieldName.includes('ogr') || fieldName.includes('öğr')) {
              console.log(`Found potential Dr. Öğr. Üyesi field: ${fieldName}, Type: ${field.constructor.name}`);
            }
            
            // Check if this field is potentially a position checkbox
            const isPositionCheckbox = (
              fieldName.includes('prof') || fieldName.includes('dr') || fieldName.includes('doç') || 
              fieldName.includes('doc') || fieldName.includes('ara') || fieldName.includes('kadro') ||
              fieldName.includes('ogr') || fieldName.includes('öğr') || 
              fieldName === 'p' || fieldName === 'd' || fieldName === 'a'
            );
            
            // Check if we have data for this field name
            if (processedDataMap[fieldName] !== undefined) {
              if (field.constructor.name === 'PDFTextField') {
                field.setText(String(processedDataMap[fieldName]));
                console.log(`Filled field "${fieldName}" with value: ${processedDataMap[fieldName]}`);
              } else if (field.constructor.name === 'PDFCheckBox' || field.constructor.name === 'PDFRadioGroup') {
                // For checkboxes, boolean values should be automatically converted to checkbox state
                if (processedDataMap[fieldName] === true) {
                  try {
                    field.check();
                    console.log(`Checked checkbox "${fieldName}"`);
                    
                    // Mark if we checked the Dr. Öğr. Üyesi checkbox
                    if (fieldName.includes('dr') && (fieldName.includes('ogr') || fieldName.includes('öğr'))) {
                      drOgrUyesiChecked = true;
                    }
                  } catch (checkError) {
                    console.error(`Error checking checkbox ${fieldName}:`, checkError);
                  }
                }
              }
            } else if (isPositionCheckbox && (field.constructor.name === 'PDFCheckBox' || field.constructor.name === 'PDFRadioGroup')) {
              // For position-related checkboxes, do a more permissive check
              // Get kademe value
              const kademeLower = kademe?.toLowerCase() || '';
              
              // Check for common position patterns
              if (
                (fieldName.includes('prof') && kademeLower.includes('prof')) ||
                (fieldName.includes('doç') && kademeLower.includes('doç')) ||
                (fieldName.includes('doc') && (kademeLower.includes('doç') || kademeLower.includes('doçent'))) ||
                (fieldName.includes('dr') && (kademeLower.includes('dr') || kademeLower.includes('öğr'))) ||
                (fieldName.includes('öğr') && kademeLower.includes('öğr')) ||
                (fieldName.includes('ogr') && (kademeLower.includes('öğr') || kademeLower.includes('ogr'))) ||
                (fieldName.includes('ara') && (kademeLower.includes('ara') || kademeLower.includes('görevli')))
              ) {
                try {
                  field.check();
                  console.log(`Checked position checkbox "${fieldName}" based on kademe: ${kademeLower}`);
                  
                  // Mark if we checked the Dr. Öğr. Üyesi checkbox
                  if (fieldName.includes('dr') && (fieldName.includes('ogr') || fieldName.includes('öğr'))) {
                    drOgrUyesiChecked = true;
                  }
                } catch (checkError) {
                  console.error(`Error checking position checkbox ${fieldName}:`, checkError);
                }
              }
            } else {
              // Check if this is a category-related field (a1_makale, etc.)
              const categoryMatch = fieldName.match(/^([a-z]\d+)[-_]?(makale|baslik|puan|yil|doi)(\d+)?(_puan)?$/i);
              if (categoryMatch) {
                const category = categoryMatch[1]; // a1, a2, etc.
                const fieldType = categoryMatch[2]; // makale, baslik, etc.
                const fieldNum = categoryMatch[3] || '1'; // If no number, default to 1
                const isPointSuffix = categoryMatch[4] === '_puan'; // Check if it has _puan suffix
                
                // Construct the field key based on the pattern
                let matchKey;
                if (isPointSuffix) {
                  // If it has _puan suffix, look for title + _puan
                  matchKey = `${category.toLowerCase()}_${fieldType}${fieldNum}_puan`;
                } else if (fieldType === 'puan') {
                  // If the field type is puan, use category_puanX
                  matchKey = `${category.toLowerCase()}_${fieldType}${fieldNum}`;
                } else {
                  // Otherwise, just use the normal key
                  matchKey = `${category.toLowerCase()}_${fieldType}${fieldNum}`;
                }
                
                const altMatchKey = `${category.toLowerCase()}_${fieldType}`;
                
                console.log(`Category field detected: "${fieldName}" -> trying "${matchKey}" or "${altMatchKey}"`);
                
                const value = processedDataMap[matchKey] || processedDataMap[altMatchKey] || '';
                
                if (value && field.constructor.name === 'PDFTextField') {
                  field.setText(String(value));
                  console.log(`Filled category field "${fieldName}" with value from ${matchKey}: ${value}`);
                }
              } else {
                // Check if this is an index-related field (q1_makale, etc.)
                const indexMatch = fieldName.match(/^(q[1-4]|esci|scopus|trdizin|ulusal)[-_]?(makale|baslik|puan|yil|doi)(\d+)?(_puan)?$/i);
                if (indexMatch) {
                  const index = indexMatch[1]; // q1, q2, etc.
                  const fieldType = indexMatch[2]; // makale, baslik, etc.
                  const fieldNum = indexMatch[3] || '1'; // If no number, default to 1
                  const isPointSuffix = indexMatch[4] === '_puan'; // Check if it has _puan suffix
                  
                  // Construct the field key based on the pattern
                  let matchKey;
                  if (isPointSuffix) {
                    // If it has _puan suffix, look for title + _puan
                    matchKey = `${index.toLowerCase()}_${fieldType}${fieldNum}_puan`;
                  } else if (fieldType === 'puan') {
                    // If the field type is puan, use index_puanX
                    matchKey = `${index.toLowerCase()}_${fieldType}${fieldNum}`;
                  } else {
                    // Otherwise, just use the normal key
                    matchKey = `${index.toLowerCase()}_${fieldType}${fieldNum}`;
                  }
                  
                  const altMatchKey = `${index.toLowerCase()}_${fieldType}`;
                  
                  console.log(`Index field detected: "${fieldName}" -> trying "${matchKey}" or "${altMatchKey}"`);
                  
                  const value = processedDataMap[matchKey] || processedDataMap[altMatchKey] || '';
                  
                  if (value && field.constructor.name === 'PDFTextField') {
                    field.setText(String(value));
                    console.log(`Filled index field "${fieldName}" with value from ${matchKey}: ${value}`);
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
              }
            }
          } catch (fieldError) {
            console.error(`Error filling field ${field.getName()}:`, fieldError);
          }
        });
        
        // If we didn't check any Dr. Öğr. Üyesi checkbox and kademe is Dr. Öğr. Üyesi,
        // add a visual checkmark using drawing operations as a fallback
        if (!drOgrUyesiChecked && isDrOgrUyesi) {
          console.log("No Dr. Öğr. Üyesi checkbox was checked. Attempting to add a visual checkmark.");
          
          try {
            // Get the first page to add a visual checkmark
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            
            // Search for likely positions where the checkbox might be
            // These are approximate positions where academic rank checkboxes might be
            // You may need to adjust these values based on your specific PDF
            const checkPositions = [
              { x: 150, y: 350 },
              { x: 150, y: 400 },
              { x: 200, y: 350 },
              { x: 200, y: 400 },
              { x: 250, y: 350 },
              { x: 250, y: 400 }
            ];
            
            // Draw a checkmark at each position
            for (const pos of checkPositions) {
              drawCheckmark(firstPage, pos.x, pos.y, customFont, 12);
            }
            
            console.log("Added visual checkmarks as fallback.");
          } catch (drawError) {
            console.error("Error adding visual checkmarks:", drawError);
          }
        }
        
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

// Helper function to map individual publications by category
function getIndividualCategoryPublications(publications) {
  const fields = {};
  
  if (!Array.isArray(publications) || publications.length === 0) {
    return fields;
  }
  
  // Group publications by category
  const categoryGroups = {
    'A1': [], 'A2': [], 'A3': [], 'A4': [], 
    'A5': [], 'A6': [], 'A7': [], 'A8': [], 'A9': []
  };
  
  publications.forEach(pub => {
    const category = pub.category || '';
    if (categoryGroups[category]) {
      categoryGroups[category].push(pub);
    }
  });
  
  // Create fields for each publication in each category
  Object.entries(categoryGroups).forEach(([category, pubs]) => {
    const catLower = category.toLowerCase();
    
    pubs.forEach((pub, idx) => {
      fields[`${catLower}_makale${idx + 1}`] = pub.title || '';
      fields[`${catLower}_baslik${idx + 1}`] = pub.title || '';
      fields[`${catLower}_puan${idx + 1}`] = pub.points || '0';
      fields[`${catLower}_yil${idx + 1}`] = pub.publicationYear || '';
      fields[`${catLower}_doi${idx + 1}`] = pub.doi || '';
      
      // Add variants that might be used in forms
      fields[`makale_${catLower}${idx + 1}`] = pub.title || '';
      fields[`baslik_${catLower}${idx + 1}`] = pub.title || '';
      fields[`${category}_makale${idx + 1}`] = pub.title || ''; // Also include uppercase
      
      // Add point field variations
      fields[`${catLower}_makale${idx + 1}_puan`] = pub.points || '0';
      fields[`${category}_makale${idx + 1}_puan`] = pub.points || '0';
      fields[`${catLower}_puan${idx + 1}`] = pub.points || '0';
      fields[`puan_${catLower}${idx + 1}`] = pub.points || '0';
      
      // Also include with underscores instead of numbers 
      if (idx === 0) {
        fields[`${catLower}_makale`] = pub.title || '';
        fields[`${catLower}_baslik`] = pub.title || '';
        fields[`${category}_makale`] = pub.title || '';
        fields[`${catLower}_puan`] = pub.points || '0';
        fields[`${category}_puan`] = pub.points || '0';
      } else {
        fields[`${catLower}_makale_${idx + 1}`] = pub.title || '';
        fields[`${catLower}_baslik_${idx + 1}`] = pub.title || '';
        fields[`${catLower}_puan_${idx + 1}`] = pub.points || '0';
      }
    });
    
    // Add count field
    fields[`${catLower}_count`] = pubs.length.toString();
    fields[`${catLower}_adet`] = pubs.length.toString();
  });
  
  return fields;
}

// Helper function to map individual publications by index
function getIndividualIndexPublications(publications) {
  const fields = {};
  
  if (!Array.isArray(publications) || publications.length === 0) {
    return fields;
  }
  
  // Group publications by index
  const indexGroups = {
    'Q1': [], 'Q2': [], 'Q3': [], 'Q4': [], 'ESCI': [], 
    'Scopus': [], 'Uluslararası Diğer': [], 'TR Dizin': [], 'Ulusal Hakemli': []
  };
  
  publications.forEach(pub => {
    const index = pub.index || '';
    if (indexGroups[index]) {
      indexGroups[index].push(pub);
    }
  });
  
  // Create fields for each publication in each index
  Object.entries(indexGroups).forEach(([index, pubs]) => {
    // Format index for field naming (lowercase, remove spaces and special chars)
    const safeIndex = index.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/öç/g, match => match === 'ö' ? 'o' : 'c')
      .replace(/[^a-z0-9_]/g, '');
    
    pubs.forEach((pub, idx) => {
      fields[`${safeIndex}_makale${idx + 1}`] = pub.title || '';
      fields[`${safeIndex}_baslik${idx + 1}`] = pub.title || '';
      fields[`${safeIndex}_puan${idx + 1}`] = pub.points || '0';
      fields[`${safeIndex}_yil${idx + 1}`] = pub.publicationYear || '';
      fields[`${safeIndex}_doi${idx + 1}`] = pub.doi || '';
      
      // Add point field variations
      fields[`${safeIndex}_makale${idx + 1}_puan`] = pub.points || '0';
      fields[`puan_${safeIndex}${idx + 1}`] = pub.points || '0';
      
      // Add common variations
      if (idx === 0) {
        fields[`${safeIndex}_makale`] = pub.title || '';
        fields[`${safeIndex}_baslik`] = pub.title || '';
        fields[`${safeIndex}_puan`] = pub.points || '0';
      } else {
        fields[`${safeIndex}_makale_${idx + 1}`] = pub.title || '';
        fields[`${safeIndex}_baslik_${idx + 1}`] = pub.title || '';
        fields[`${safeIndex}_puan_${idx + 1}`] = pub.points || '0';
      }
    });
    
    // Add count field
    fields[`${safeIndex}_count`] = pubs.length.toString();
    fields[`${safeIndex}_adet`] = pubs.length.toString();
  });
  
  return fields;
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
    // Group publications by category
    const publicationsByCategory = {};
    publications.forEach(pub => {
      const category = pub.category || '';
      if (!publicationsByCategory[category]) {
        publicationsByCategory[category] = [];
      }
      publicationsByCategory[category].push(pub);
    });
    
    // Add category-specific fields (a1_makale, a2_makale, etc.)
    Object.entries(publicationsByCategory).forEach(([category, pubs]) => {
      // Format the category to lowercase for field naming
      const categoryKey = category.toLowerCase();
      
      // Add individual publication titles for this category (a1_makale, a1_makale2, etc.)
      pubs.forEach((pub, idx) => {
        const num = idx + 1;
        fields[`${categoryKey}_makale${num}`] = pub.title || '';
        fields[`${categoryKey}_baslik${num}`] = pub.title || '';
        fields[`${categoryKey}_doi${num}`] = pub.doi || '';
        fields[`${categoryKey}_yil${num}`] = pub.publicationYear || '';
        fields[`${categoryKey}_puan${num}`] = pub.points || '0';
      });
      
      // Add a single field with all titles for this category
      fields[`${categoryKey}_makale`] = pubs.map(p => p.title).join(', ');
      fields[`${categoryKey}_makaleler`] = pubs.map(p => p.title).join(', ');
      fields[`${categoryKey}_basliklar`] = pubs.map(p => p.title).join(', ');
    });
    
    // Add individual publication fields with different naming patterns (preserve existing logic)
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
        
        // Points fields
        fields[`${baseName}${num}_points`] = pub.points || '0';
        fields[`${baseName}${num}_puan`] = pub.points || '0';
      });
      
      // Also add simple numbered fields
      fields[`title${num}`] = pub.title || '';
      fields[`category${num}`] = pub.category || '';
      fields[`index${num}`] = pub.index || '';
      fields[`year${num}`] = pub.publicationYear || '';
      fields[`doi${num}`] = pub.doi || '';
      fields[`main_author${num}`] = pub.isMainAuthor ? 'Evet' : 'Hayir';
      fields[`points${num}`] = pub.points || '0';
      
      // Turkish versions
      fields[`baslik${num}`] = pub.title || '';
      fields[`kategori${num}`] = pub.category || '';
      fields[`indeks${num}`] = pub.index || '';
      fields[`yil${num}`] = pub.publicationYear || '';
      fields[`ana_yazar${num}`] = pub.isMainAuthor ? 'Evet' : 'Hayir';
      fields[`puan${num}`] = pub.points || '0';
    });
    
    // Add a field with all publications as a text list
    let pubListText = '';
    publications.forEach((pub, index) => {
      pubListText += `${index + 1}. ${pub.title || 'Baslik belirtilmemis'}\n`;
      pubListText += `   Kategori: ${pub.category || '-'}, Indeks: ${pub.index || '-'}, Yil: ${pub.publicationYear || '-'}\n`;
      pubListText += `   DOI: ${pub.doi || '-'}, Ana Yazar: ${pub.isMainAuthor ? 'Evet' : 'Hayir'}\n`;
      pubListText += `   Puan: ${pub.points || '0'}\n\n`;
    });
    
    fields['publications_list'] = pubListText;
    fields['yayinlar_listesi'] = pubListText;
    
    // Also add fields with comma-separated titles for each index type
    const indexMapping = {
      'Q1': 'q1_makaleler',
      'Q2': 'q2_makaleler',
      'Q3': 'q3_makaleler',
      'Q4': 'q4_makaleler',
      'ESCI': 'esci_makaleler',
      'Scopus': 'scopus_makaleler',
      'Uluslararası Diğer': 'uluslararasi_makaleler',
      'TR Dizin': 'trdizin_makaleler',
      'Ulusal Hakemli': 'ulusal_makaleler'
    };
    
    // Group by index
    const publicationsByIndex = {};
    publications.forEach(pub => {
      const index = pub.index || '';
      if (!publicationsByIndex[index]) {
        publicationsByIndex[index] = [];
      }
      publicationsByIndex[index].push(pub);
    });
    
    // Create fields for each index type
    Object.entries(publicationsByIndex).forEach(([index, pubs]) => {
      if (indexMapping[index]) {
        fields[indexMapping[index]] = pubs.map(p => p.title).join(', ');
      }
    });
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

// Helper function to draw a checkmark
function drawCheckmark(page, x, y, font, size = 12) {
  const { rgb } = PDFLib;
  
  // Draw a checkmark symbol (✓)
  page.drawText('✓', {
    x: x,
    y: y,
    size: size,
    font: font,
    color: rgb(0, 0, 0)
  });
  
  // Draw a small box around it to make it look like a checked checkbox
  page.drawRectangle({
    x: x - 2,
    y: y - 2,
    width: size + 4,
    height: size + 4,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
    borderOpacity: 0.7,
  });
}

module.exports = router; 
