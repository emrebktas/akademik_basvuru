require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../db/models/User'); // Make sure this is correct
const soap = require('soap');
const router = express.Router();
const jwt = require('jsonwebtoken');
const authMiddleware = require("../middleware/auth");

const NVI_WSDL_URL = process.env.NVI_WSDL_URL;

router.post('/register', async (req, res) => {
    try {
        const { tc_kimlik_no, ad, soyad, password, rol, dogum_yili } = req.body;

        console.log('Verifying TC Kimlik No before registration:', req.body);

        // Check if user already exists
        const existingUser = await User.findOne({ tc_kimlik_no });
        if (existingUser) return res.status(400).json({ error: 'User already registered' });

        console.log('Creating SOAP client...');
        soap.createClient(NVI_WSDL_URL, (err, client) => {
            if (err) {
                console.error('SOAP Client Creation Error:', err);
                return res.status(500).json({ error: 'SOAP Client Creation Error' });
            }

            console.log('Sending request to NVİ for verification...');
            const args = {
                TCKimlikNo: tc_kimlik_no,
                Ad: ad.toLocaleUpperCase('tr-TR'),
                Soyad: soyad.toLocaleUpperCase('tr-TR'),
                DogumYili: dogum_yili
            };

            client.TCKimlikNoDogrula(args, async (err, result) => {
                if (err) {
                    console.error('SOAP Request Error:', err);
                    return res.status(500).json({ error: 'SOAP Request Error' });
                }

                const isValid = result.TCKimlikNoDogrulaResult;
                console.log('NVİ API Response:', isValid);

                if (!isValid) {
                    return res.status(400).json({ error: 'Invalid TC Kimlik No' });
                }

                // ✅ TC is valid, now hash the password and save the user
                console.log('Hashing password...');
                const hashedPassword = await bcrypt.hash(password, 10);

                console.log('Saving user to database...');
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
        console.error('Server Error:', error.message);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { tc_kimlik_no, password } = req.body;

        console.log('🔍 Checking user credentials...');
        
        // Check if user exists
        const user = await User.findOne({ tc_kimlik_no });
        if (!user) return res.status(400).json({ error: 'Geçersiz TC Kimlik No veya şifre' });

        // Verify Password
        const isMatch = await bcrypt.compare(password, user.sifre_hash);
        if (!isMatch) return res.status(400).json({ error: 'Geçersiz TC Kimlik No veya şifre' });

        // Verify that the user has a role
        if (!user.rol) {
            return res.status(403).json({ 
                error: 'Kullanıcı rolü tanımlanmamış. Sistem yöneticisiyle iletişime geçin.'
            });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { _id: user._id, tc_kimlik_no: user.tc_kimlik_no, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } 
        );

        console.log('✅ Login successful, JWT issued.');

        // Return user information along with token
        res.status(200).json({ 
            message: 'Login successful', 
            token,
            user: {
                _id: user._id,
                tc_kimlik_no: user.tc_kimlik_no,
                ad: user.ad,
                soyad: user.soyad,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error('Server Error:', error.message);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

router.post('/delete', authMiddleware, async (req, res) => {
    try {
        const { tc_kimlik_no } = req.user; // Extract from JWT
        const { target_tc_kimlik_no } = req.body; // User to be deleted

        console.log(`🔍 Request to delete user: ${target_tc_kimlik_no} by ${tc_kimlik_no}`);

        // Ensure user exists
        const user = await User.findOne({ tc_kimlik_no: target_tc_kimlik_no });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Only allow self-deletion, unless the user is an admin
        if (tc_kimlik_no !== target_tc_kimlik_no && req.user.rol !== 'Admin') {
            return res.status(403).json({ error: 'Unauthorized: Cannot delete other users' });
        }

        // Delete user
        await User.deleteOne({ tc_kimlik_no: target_tc_kimlik_no });

        console.log(`✅ User ${target_tc_kimlik_no} deleted successfully.`);
        res.status(200).json({ message: 'User deleted successfully' });

    } catch (error) {
        console.error('❌ Server Error:', error.message);
        res.status(500).json({ error: 'Server error', details: error.message });
    }
});

module.exports = router;
