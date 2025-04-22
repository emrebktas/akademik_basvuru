import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './login.jsx';
import Register from './register.jsx';
import AdayEkrani from './aday-ekrani.jsx';
import YoneticiEkrani from './yonetici-ekrani.jsx'; // Updated to match the component name
import AdminEkrani from './admin-ekrani.jsx';
import JuriEkrani from './juri-ekrani.jsx';
import DrOgrUyesiBasvuruForm from './components/DrOgrUyesiBasvuruForm.jsx';

// Diğer ekranlar için placeholder bileşenler
const Dashboard = () => <div>Dashboard</div>;

// Koruyucu Route bileşeni
const ProtectedRoute = ({ element, allowedRoles }) => {
  const location = useLocation();
  
  // LocalStorage'dan kullanıcı bilgisini ve token'ı al
  const userString = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  // Kullanıcı giriş yapmış mı kontrol et
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Kullanıcı bilgisi varsa, rolünü kontrol et
  if (userString) {
    try {
      const user = JSON.parse(userString);
      
      // Kullanıcının rolü izin verilen roller arasında mı kontrol et
      if (allowedRoles.includes(user.rol)) {
        return element;
      }
    } catch (error) {
      console.error("Kullanıcı bilgisi ayrıştırılamadı:", error);
    }
  }
  
  // Yetkisiz erişim durumunda, login sayfasına yönlendir
  return <Navigate to="/login" state={{ from: location }} replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rol bazlı korumalı rotalar */}
        <Route 
          path="/aday-ekrani" 
          element={<ProtectedRoute element={<AdayEkrani />} allowedRoles={['Aday']} />} 
        />
        <Route 
          path="/juri-ekrani" 
          element={<ProtectedRoute element={<JuriEkrani />} allowedRoles={['Juri']} />} 
        />
        <Route 
          path="/yonetici-ekrani" 
          element={<ProtectedRoute element={<YoneticiEkrani />} allowedRoles={['Yonetici']} />} 
        />
        <Route 
          path="/admin-ekrani" 
          element={<ProtectedRoute element={<AdminEkrani />} allowedRoles={['Admin']} />} 
        />
        <Route 
          path="/dashboard" 
          element={<ProtectedRoute element={<Dashboard />} allowedRoles={['Aday', 'Juri', 'Yonetici', 'Admin']} />} 
        />
        <Route 
          path="/dr-ogr-uyesi-basvuru" 
          element={<ProtectedRoute element={<DrOgrUyesiBasvuruForm />} allowedRoles={['Aday']} />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
