// src/Login.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Image,
  Flex,
  HStack,
  SimpleGrid,
  Center,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  CardHeader,
} from '@chakra-ui/react';
import axios from 'axios';


function Login() {
  const [formData, setFormData] = useState({
    tc_kimlik_no: '',
    password: '',
    role: 'Aday'
  });
  const toast = useToast();

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
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/login`, formData);
      
      // Store token in localStorage
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      
      toast({
        title: 'Login Successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Redirect based on role
    } catch (error) {
      toast({
        title: 'Login Failed',
        description: error.response?.data?.error || 'Invalid credentials',
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
                <Tab>Jüri</Tab>
                <Tab>Yönetici</Tab>
                <Tab>Admin</Tab>
              </TabList>
              <TabPanels>
                {/* Academic Staff Login Panel */}
                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" mb={2}>Aday Giriş</Heading>
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

                {/* Jury Member Login Panel */}
                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" mb={2}>Jüri Üyesi Giriş</Heading>
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

                {/* Manager Login Panel */}
                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" mb={2}>Yönetici Giriş</Heading>
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

                {/* Admin Login Panel */}
                <TabPanel>
                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md" mb={2}>Admin Girişi</Heading>
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