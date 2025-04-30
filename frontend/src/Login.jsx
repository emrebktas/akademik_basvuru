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
  AlertIcon,
  Divider,
  Flex,
  Icon
} from '@chakra-ui/react';
import axios from 'axios';
import { FaUser, FaUserTie, FaUserCog, FaUserShield, FaGraduationCap } from 'react-icons/fa';

// Kocaeli Üniversitesi tema renkleri
const theme = {
  primary: "#17468f", // Koyu Mavi (Ana renk)
  secondary: "#e74c3c", // Kırmızı (Vurgu rengi)
  tertiary: "#1abc9c", // Turkuaz (Yardımcı renk)
  light: "#ecf0f1", // Açık gri
  success: "#2ecc71", // Yeşil
  warning: "#f39c12", // Turuncu
  danger: "#c0392b", // Koyu kırmızı
  info: "#3498db" // Açık mavi
};

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
    <Box minH="100vh" bg={theme.light} py={10}>
      <Container maxW="container.md">
        {/* Header */}
        <Box textAlign="center" mb={6}>
          <Heading size="2xl" color={theme.primary}>Kocaeli Üniversitesi</Heading>
          <Heading size="md" color={theme.primary} mt={2}>Akademik İlan Başvuru Sistemi</Heading>
          <Divider my={4} borderColor={theme.secondary} borderWidth="2px" width="60%" mx="auto" />
        </Box>

        <Card boxShadow="lg" borderRadius="lg" overflow="hidden">
          <CardHeader bg={theme.primary} color="white" py={4} textAlign="center">
            <Heading size="lg">Giriş Yap</Heading>
          </CardHeader>
          <CardBody bg="white" p={6}>
            <Tabs 
              isFitted 
              variant="soft-rounded" 
              onChange={handleRoleChange}
              colorScheme="blue"
            >
              <TabList mb="1.5em" gap={3}>
                <Tab 
                  _selected={{ 
                    color: "white", 
                    bg: theme.primary,
                    fontWeight: "bold"
                  }}
                  borderRadius="full"
                >
                  <Icon as={FaGraduationCap} mr={2} />
                  Aday
                </Tab>
                <Tab 
                  _selected={{ 
                    color: "white", 
                    bg: theme.primary,
                    fontWeight: "bold"
                  }}
                  borderRadius="full"
                >
                  <Icon as={FaUserTie} mr={2} />
                  Jüri
                </Tab>
                <Tab 
                  _selected={{ 
                    color: "white", 
                    bg: theme.primary,
                    fontWeight: "bold"
                  }}
                  borderRadius="full"
                >
                  <Icon as={FaUserCog} mr={2} />
                  Yönetici
                </Tab>
                <Tab 
                  _selected={{ 
                    color: "white", 
                    bg: theme.primary,
                    fontWeight: "bold"
                  }}
                  borderRadius="full"
                >
                  <Icon as={FaUserShield} mr={2} />
                  Admin
                </Tab>
              </TabList>
              <TabPanels>
                {/* Aday Giriş Paneli */}
                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={5} align="stretch">
                      <Flex justifyContent="center" mb={4}>
                        <Flex 
                          bg={`${theme.primary}20`} 
                          p={4} 
                          borderRadius="full" 
                          color={theme.primary}
                          boxSize="80px"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon as={FaGraduationCap} boxSize="40px" />
                        </Flex>
                      </Flex>
                      {error && (
                        <Alert status="error" borderRadius="md" bg={`${theme.danger}10`}>
                          <AlertIcon color={theme.danger} />
                          {error}
                        </Alert>
                      )}
                      <FormControl isRequired>
                        <FormLabel fontWeight="bold" color={theme.primary}>TC Kimlik Numarası</FormLabel>
                        <Input
                          name="tc_kimlik_no"
                          type="text" 
                          value={formData.tc_kimlik_no}
                          onChange={handleChange}
                          borderColor="gray.300"
                          focusBorderColor={theme.primary}
                          _hover={{ borderColor: theme.info }}
                          placeholder="TC Kimlik numaranızı giriniz"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel fontWeight="bold" color={theme.primary}>Şifre</FormLabel>
                        <Input
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          autoComplete="current-password"
                          borderColor="gray.300"
                          focusBorderColor={theme.primary}
                          _hover={{ borderColor: theme.info }}
                          placeholder="Şifrenizi giriniz"
                        />
                      </FormControl>
                      
                      <Button 
                        type="submit" 
                        bg={theme.primary}
                        color="white"
                        width="full"
                        mt={4}
                        _hover={{ bg: theme.info }}
                        size="lg"
                      >
                        Giriş Yap
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                {/* Jüri Üyesi Giriş Paneli */}
                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={5} align="stretch">
                      <Flex justifyContent="center" mb={4}>
                        <Flex 
                          bg={`${theme.primary}20`} 
                          p={4} 
                          borderRadius="full" 
                          color={theme.primary}
                          boxSize="80px"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon as={FaUserTie} boxSize="40px" />
                        </Flex>
                      </Flex>
                      {error && (
                        <Alert status="error" borderRadius="md" bg={`${theme.danger}10`}>
                          <AlertIcon color={theme.danger} />
                          {error}
                        </Alert>
                      )}
                      <FormControl isRequired>
                        <FormLabel fontWeight="bold" color={theme.primary}>TC Kimlik Numarası</FormLabel>
                        <Input
                          name="tc_kimlik_no"
                          type="text" 
                          value={formData.tc_kimlik_no}
                          onChange={handleChange}
                          borderColor="gray.300"
                          focusBorderColor={theme.primary}
                          _hover={{ borderColor: theme.info }}
                          placeholder="TC Kimlik numaranızı giriniz"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel fontWeight="bold" color={theme.primary}>Şifre</FormLabel>
                        <Input
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          autoComplete="current-password"
                          borderColor="gray.300"
                          focusBorderColor={theme.primary}
                          _hover={{ borderColor: theme.info }}
                          placeholder="Şifrenizi giriniz"
                        />
                      </FormControl>
                      
                      <Button 
                        type="submit" 
                        bg={theme.primary}
                        color="white"
                        width="full"
                        mt={4}
                        _hover={{ bg: theme.info }}
                        size="lg"
                      >
                        Giriş Yap
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                {/* Yönetici Giriş Paneli */}
                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={5} align="stretch">
                      <Flex justifyContent="center" mb={4}>
                        <Flex 
                          bg={`${theme.primary}20`} 
                          p={4} 
                          borderRadius="full" 
                          color={theme.primary}
                          boxSize="80px"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon as={FaUserCog} boxSize="40px" />
                        </Flex>
                      </Flex>
                      {error && (
                        <Alert status="error" borderRadius="md" bg={`${theme.danger}10`}>
                          <AlertIcon color={theme.danger} />
                          {error}
                        </Alert>
                      )}
                      <FormControl isRequired>
                        <FormLabel fontWeight="bold" color={theme.primary}>TC Kimlik Numarası</FormLabel>
                        <Input
                          name="tc_kimlik_no"
                          type="text" 
                          value={formData.tc_kimlik_no}
                          onChange={handleChange}
                          borderColor="gray.300"
                          focusBorderColor={theme.primary}
                          _hover={{ borderColor: theme.info }}
                          placeholder="TC Kimlik numaranızı giriniz"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel fontWeight="bold" color={theme.primary}>Şifre</FormLabel>
                        <Input
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          autoComplete="current-password"
                          borderColor="gray.300"
                          focusBorderColor={theme.primary}
                          _hover={{ borderColor: theme.info }}
                          placeholder="Şifrenizi giriniz"
                        />
                      </FormControl>
                      
                      <Button 
                        type="submit" 
                        bg={theme.primary}
                        color="white"
                        width="full"
                        mt={4}
                        _hover={{ bg: theme.info }}
                        size="lg"
                      >
                        Giriş Yap
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                {/* Admin Giriş Paneli */}
                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={5} align="stretch">
                      <Flex justifyContent="center" mb={4}>
                        <Flex 
                          bg={`${theme.primary}20`} 
                          p={4} 
                          borderRadius="full" 
                          color={theme.primary}
                          boxSize="80px"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Icon as={FaUserShield} boxSize="40px" />
                        </Flex>
                      </Flex>
                      {error && (
                        <Alert status="error" borderRadius="md" bg={`${theme.danger}10`}>
                          <AlertIcon color={theme.danger} />
                          {error}
                        </Alert>
                      )}
                      <FormControl isRequired>
                        <FormLabel fontWeight="bold" color={theme.primary}>TC Kimlik Numarası</FormLabel>
                        <Input
                          name="tc_kimlik_no"
                          type="text" 
                          value={formData.tc_kimlik_no}
                          onChange={handleChange}
                          borderColor="gray.300"
                          focusBorderColor={theme.primary}
                          _hover={{ borderColor: theme.info }}
                          placeholder="TC Kimlik numaranızı giriniz"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel fontWeight="bold" color={theme.primary}>Şifre</FormLabel>
                        <Input
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                          autoComplete="current-password"
                          borderColor="gray.300"
                          focusBorderColor={theme.primary}
                          _hover={{ borderColor: theme.info }}
                          placeholder="Şifrenizi giriniz"
                        />
                      </FormControl>
                      
                      <Button 
                        type="submit" 
                        bg={theme.primary}
                        color="white"
                        width="full"
                        mt={4}
                        _hover={{ bg: theme.info }}
                        size="lg"
                      >
                        Giriş Yap
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>
              </TabPanels>
            </Tabs>

            <Divider my={6} borderColor={`${theme.primary}30`} />

            <Text textAlign="center" color={theme.primary}>
              Sisteme kayıtlı değil misiniz?{" "}
              <Link to="/register">
                <Button 
                  variant="link" 
                  color={theme.secondary}
                  _hover={{ color: theme.danger }}
                  fontWeight="bold"
                >
                  Kayıt ol
                </Button>
              </Link>
            </Text>
            
            <Text textAlign="center" mt={4} fontSize="sm" color="gray.500">
              <Link to="/">
                <Button 
                  variant="link" 
                  color={theme.primary}
                  size="sm"
                  fontWeight="normal"
                >
                  Ana Sayfaya Dön
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