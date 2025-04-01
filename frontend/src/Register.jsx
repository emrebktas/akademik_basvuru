import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Text,
  Container,
  useToast,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  CardHeader,
  Select,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const [formData, setFormData] = useState({
    tc_kimlik_no: '',
    ad: '',
    soyad: '',
    password: '',
    password_confirm: '',
    rol: 'Aday',
    dogum_yili: ''
  });
  const toast = useToast();

  // Generate years from 1960 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1959 }, (_, i) => (1960 + i).toString());

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
      ad: '',
      soyad: '',
      password: '',
      password_confirm: '',
      rol: roles[index],
      dogum_yili: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.password_confirm) {
      toast({
        title: "Şifreler eşleşmiyor",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/users/register`, {
        tc_kimlik_no: formData.tc_kimlik_no,
        ad: formData.ad,
        soyad: formData.soyad,
        password: formData.password,
        rol: formData.rol,
        dogum_yili: formData.dogum_yili
      });
      
      toast({
        title: 'Kayıt Başarılı',
        description: 'Giriş yapabilirsiniz',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      toast({
        title: 'Kayıt Başarısız',
        description: error.response?.data?.error || 'Bir hata oluştu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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
                <Tab>Jüri Üyesi</Tab>
                <Tab>Yönetici</Tab>
                <Tab>Admin</Tab>
              </TabList>
              <TabPanels>
                {/* Registration Panel for Academic Staff */}
                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" mb={2}>Aday Kayıt</Heading>
                      
                      <FormControl isRequired>
                        <FormLabel>T.C. Kimlik No</FormLabel>
                        <Input
                          name="tc_kimlik_no"
                          type="text" 
                          value={formData.tc_kimlik_no}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Ad</FormLabel>
                        <Input
                          name="ad"
                          type="text" 
                          value={formData.ad}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Soyad</FormLabel>
                        <Input
                          name="soyad"
                          type="text" 
                          value={formData.soyad}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Doğum Yılı</FormLabel>
                        <Select
                          name="dogum_yili"
                          value={formData.dogum_yili}
                          onChange={handleChange}
                          placeholder="Doğum yılınızı seçin"
                        >
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Şifre</FormLabel>
                        <Input
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Şifre Tekrar</FormLabel>
                        <Input
                          name="password_confirm"
                          type="password"
                          value={formData.password_confirm}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <Button 
                        type="submit" 
                        colorScheme="blue"
                        width="full"
                        mt={2}
                      >
                        Kayıt Ol
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                {/* Registration Panel for Jury */}
                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" mb={2}>Jüri Üyesi Kayıt</Heading>
                      
                      <FormControl isRequired>
                        <FormLabel>T.C. Kimlik No</FormLabel>
                        <Input
                          name="tc_kimlik_no"
                          type="text" 
                          value={formData.tc_kimlik_no}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Ad</FormLabel>
                        <Input
                          name="ad"
                          type="text" 
                          value={formData.ad}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Soyad</FormLabel>
                        <Input
                          name="soyad"
                          type="text" 
                          value={formData.soyad}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Doğum Yılı</FormLabel>
                        <Select
                          name="dogum_yili"
                          value={formData.dogum_yili}
                          onChange={handleChange}
                          placeholder="Doğum yılınızı seçin"
                        >
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Şifre</FormLabel>
                        <Input
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Şifre Tekrar</FormLabel>
                        <Input
                          name="password_confirm"
                          type="password"
                          value={formData.password_confirm}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <Button 
                        type="submit" 
                        colorScheme="blue"
                        width="full"
                        mt={2}
                      >
                        Kayıt Ol
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                {/* Registration Panel for Manager */}
                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" mb={2}>Yönetici Kayıt</Heading>
                      
                      <FormControl isRequired>
                        <FormLabel>T.C. Kimlik No</FormLabel>
                        <Input
                          name="tc_kimlik_no"
                          type="text" 
                          value={formData.tc_kimlik_no}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Ad</FormLabel>
                        <Input
                          name="ad"
                          type="text" 
                          value={formData.ad}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Soyad</FormLabel>
                        <Input
                          name="soyad"
                          type="text" 
                          value={formData.soyad}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Doğum Yılı</FormLabel>
                        <Select
                          name="dogum_yili"
                          value={formData.dogum_yili}
                          onChange={handleChange}
                          placeholder="Doğum yılınızı seçin"
                        >
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Şifre</FormLabel>
                        <Input
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Şifre Tekrar</FormLabel>
                        <Input
                          name="password_confirm"
                          type="password"
                          value={formData.password_confirm}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <Button 
                        type="submit" 
                        colorScheme="blue"
                        width="full"
                        mt={2}
                      >
                        Kayıt Ol
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                {/* Registration Panel for Admin */}
                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" mb={2}>Admin Kayıt</Heading>
                      
                      <FormControl isRequired>
                        <FormLabel>T.C. Kimlik No</FormLabel>
                        <Input
                          name="tc_kimlik_no"
                          type="text" 
                          value={formData.tc_kimlik_no}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Ad</FormLabel>
                        <Input
                          name="ad"
                          type="text" 
                          value={formData.ad}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Soyad</FormLabel>
                        <Input
                          name="soyad"
                          type="text" 
                          value={formData.soyad}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Doğum Yılı</FormLabel>
                        <Select
                          name="dogum_yili"
                          value={formData.dogum_yili}
                          onChange={handleChange}
                          placeholder="Doğum yılınızı seçin"
                        >
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Şifre</FormLabel>
                        <Input
                          name="password"
                          type="password"
                          value={formData.password}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Şifre Tekrar</FormLabel>
                        <Input
                          name="password_confirm"
                          type="password"
                          value={formData.password_confirm}
                          onChange={handleChange}
                        />
                      </FormControl>
                      
                      <Button 
                        type="submit" 
                        colorScheme="blue"
                        width="full"
                        mt={2}
                      >
                        Kayıt Ol
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>
              </TabPanels>
            </Tabs>

            <Text textAlign="center" mt={4}>
              Hesabınız var mı?{" "}
              <Link to="/login">
                <Button variant="link" colorScheme="blue" size="sm">
                  Giriş Yap
                </Button>
              </Link>
            </Text>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
}

export default Register;
