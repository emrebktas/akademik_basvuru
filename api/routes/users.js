require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../db/models/User'); // Make sure this is correct
const soap = require('soap');
const router = express.Router();

const NVI_WSDL_URL = process.env.NVI_WSDL_URL;

router.post('/register', async (req, res) => {
    try {
        const { tc_kimlik_no, ad, soyad, password, rol, dogum_yili } = req.body;

        console.log('🚀 Verifying TC Kimlik No before registration:', req.body);

        // Check if user already exists
        const existingUser = await User.findOne({ tc_kimlik_no });
        if (existingUser) return res.status(400).json({ error: 'User already registered' });

        console.log('🌐 Creating SOAP client...');
        soap.createClient(NVI_WSDL_URL, (err, client) => {
            if (err) {
                console.error('❌ SOAP Client Creation Error:', err);
                return res.status(500).json({ error: 'SOAP Client Creation Error' });
            }

            console.log('📡 Sending request to NVİ for verification...');
            const args = {
                TCKimlikNo: tc_kimlik_no,
                Ad: ad.toUpperCase(),
                Soyad: soyad.toUpperCase(),
                DogumYili: dogum_yili
            };

            client.TCKimlikNoDogrula(args, async (err, result) => {
                if (err) {
                    console.error('❌ SOAP Request Error:', err);
                    return res.status(500).json({ error: 'SOAP Request Error' });
                }

                const isValid = result.TCKimlikNoDogrulaResult;
                console.log('✅ NVİ API Response:', isValid);

                if (!isValid) {
                    return res.status(400).json({ error: 'Invalid TC Kimlik No' });
                }

                // ✅ TC is valid, now hash the password and save the user
                console.log('🔒 Hashing password...');
                const hashedPassword = await bcrypt.hash(password, 10);

                console.log('💾 Saving user to database...');
                const newUser = new User({
                    tc_kimlik_no,
                    ad,
                    soyad,
                    sifre_hash: hashedPassword,
                    rol,
                    dogum_yili,
                    tc_verified: true // Verified before saving
                });

                await newUser.save();
                console.log('✅ User registered successfully!');

                res.status(201).json({ message: 'User registered successfully', tc_verified: true });
            });
        });

    } catch (error) {
        console.error('❌ Server Error:', error.message);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});





module.exports = router;
