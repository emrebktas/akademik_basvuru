// src/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Container,
  useToast,
  Card,
  CardBody,
  CardHeader,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import axios from 'axios';


function Login() {
  const [formData, setFormData] = useState({
    tc_kimlik_no: '',
    password: '',
    role: 'Aday'
  });
  const toast = useToast();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleRoleChange = (index) => {
    const roles = ['Aday', 'Juri', 'Yonetici', 'Admin'];    
    setFormData({
      tc_kimlik_no: '',
      password: '',
      role: roles[index]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    try {
      // Giriş yapılıyor
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/login`, {
        tc_kimlik_no: formData.tc_kimlik_no,
        password: formData.password
      });
      
      // Kullanıcının rolü ile seçilen sekmedeki rolün eşleşip eşleşmediğini kontrol et
      const userRole = response.data.user.rol;
      if (userRole !== formData.role) {
        setError(`Lütfen rolünüze uygun sekmeden giriş yapınız.`);
        return;
      }
      
      // Token'ı localStorage'a kaydet
      localStorage.setItem('token', response.data.token);
      
      // Kullanıcı bilgilerini localStorage'a kaydet
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // Rolü ayrıca kaydet (ProtectedRoute için gerekli)
      localStorage.setItem('role', response.data.user.rol);
      
      // Giriş başarılı bildirimi
      toast({
        title: 'Giriş Başarılı',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Doğru role göre yönlendirme yap
      switch (response.data.user.rol) {
        case 'Aday':
          navigate('/aday-ekrani');
          break;
        case 'Juri':
          navigate('/juri-ekrani');
          break;
        case 'Yonetici':
          navigate('/yonetici-ekrani');
          break;
        case 'Admin':
          navigate('/admin-ekrani');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      // Kullanıcı adı veya şifre hatalı
      if (error.response && error.response.status === 400) {
        setError("TC kimlik no veya şifre hatalı!");
      // Rol eşleşmiyor
      } else if (error.response && error.response.status === 403) {
        setError(error.response.data.error || 'Seçtiğiniz rol ile giriş yapamazsınız.');
      // Diğer hatalar
      } else {
        setError("Giriş yapılırken bir hata oluştu.");
        console.error("Login error:", error);
      }
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" py={10}>
      <Container maxW="container.md">
        <Card boxShadow="md" mb={8}>
          <CardHeader bg="blue.600" color="white">
            <Heading size="lg" textAlign="center">Akademik Başvuru Sistemi</Heading>
          </CardHeader>
          <CardBody>
            <Tabs isFitted variant="enclosed" onChange={handleRoleChange}>
              <TabList mb="1em">
                <Tab>Aday</Tab>
                <Tab>Jüri</Tab>
                <Tab>Yönetici</Tab>
                <Tab>Admin</Tab>
              </TabList>
              <TabPanels>
                {/* Aday Giriş Paneli */}
                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" mb={2}>Aday Giriş</Heading>
                      {error && (
                        <Alert status="error" borderRadius="md">
                          <AlertIcon />
                          {error}
                        </Alert>
                      )}
                      <FormControl isRequired>
                        <FormLabel>TC Kimlik Numarası</FormLabel>
                        <Input
                          name="tc_kimlik_no"
                          type="text" 
                          value={formData.tc_kimlik_no}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Şifre</FormLabel>
                        <Input
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          autoComplete="current-password"
                        />
                      </FormControl>
                      
                      <Button 
                        type="submit" 
                        colorScheme="blue"
                        width="full"
                        mt={2}
                      >
                        Giriş
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                {/* Jüri Üyesi Giriş Paneli */}
                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" mb={2}>Jüri Üyesi Giriş</Heading>
                      {error && (
                        <Alert status="error" borderRadius="md">
                          <AlertIcon />
                          {error}
                        </Alert>
                      )}
                      <FormControl isRequired>
                        <FormLabel>TC Kimlik Numarası</FormLabel>
                        <Input
                          name="tc_kimlik_no"
                          type="text" 
                          value={formData.tc_kimlik_no}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Şifre</FormLabel>
                        <Input
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          autoComplete="current-password"
                        />
                      </FormControl>
                      
                      <Button 
                        type="submit" 
                        colorScheme="blue"
                        width="full"
                        mt={2}
                      >
                        Giriş
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                {/* Yönetici Giriş Paneli */}
                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" mb={2}>Yönetici Giriş</Heading>
                      {error && (
                        <Alert status="error" borderRadius="md">
                          <AlertIcon />
                          {error}
                        </Alert>
                      )}
                      <FormControl isRequired>
                        <FormLabel>TC Kimlik Numarası</FormLabel>
                        <Input
                          name="tc_kimlik_no"
                          type="text" 
                          value={formData.tc_kimlik_no}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Şifre</FormLabel>
                        <Input
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          autoComplete="current-password"
                        />
                      </FormControl>
                      
                      <Button 
                        type="submit" 
                        colorScheme="blue"
                        width="full"
                        mt={2}
                      >
                        Giriş
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                {/* Admin Giriş Paneli */}
                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" mb={2}>Admin Girişi</Heading>
                      {error && (
                        <Alert status="error" borderRadius="md">
                          <AlertIcon />
                          {error}
                        </Alert>
                      )}
                      <FormControl isRequired>
                        <FormLabel>TC Kimlik Numarası</FormLabel>
                        <Input
                          name="tc_kimlik_no"
                          type="text" 
                          value={formData.tc_kimlik_no}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Şifre</FormLabel>
                        <Input
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          autoComplete="current-password"
                        />
                      </FormControl>
                      
                      <Button 
                        type="submit" 
                        colorScheme="blue"
                        width="full"
                        mt={2}
                      >
                        Giriş
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>
              </TabPanels>
            </Tabs>

            <Text textAlign="center" mt={4}>
              Sisteme kayıtlı değil misiniz?{" "}
              <Link to="/register">
                <Button variant="link" colorScheme="blue" size="sm">
                  Kayıt ol
                </Button>
              </Link>
            </Text>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
}

export default Login;