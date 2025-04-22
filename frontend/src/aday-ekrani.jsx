import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Heading, Text, VStack, HStack, Button, useToast, 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, useDisclosure, Badge, Divider, SimpleGrid,
  Card, CardHeader, CardBody, CardFooter, Flex, Spinner, 
  Alert, AlertIcon, AlertTitle, AlertDescription, Tabs, TabList, 
  Tab, TabPanels, TabPanel, Icon, Stack, Skeleton, Progress, Avatar,
  FormControl, FormLabel, Input, Select, List, ListItem, ListIcon
} from '@chakra-ui/react';
import { FaFileAlt, FaCheck, FaTimes, FaClock, FaEye, FaPaperPlane, FaUpload, FaFile, FaTrash } from 'react-icons/fa';

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

const AdayEkrani = () => {
  const [ilanlar, setIlanlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIlan, setSelectedIlan] = useState(null);
  const [userApplications, setUserApplications] = useState([]);
  const [activeView, setActiveView] = useState('ilanlar'); // 'ilanlar', 'basvurular', 'form'
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate(); // React Router'dan navigate hook'unu ekledik

  // Kullanıcı bilgilerini localStorage'dan al
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const userId = userInfo?.id;
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchIlanlar();
    if (userId) {
      fetchUserApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const fetchIlanlar = async () => {
    try {
      setLoading(true);
      console.log('İlanlar çekiliyor...');
      const response = await axios.get('/api/applications/get-active-posts', {
        headers: {Authorization: `Bearer ${token}` }
      });
      console.log('API yanıtı:', response);
      
      // Ensure ilanlar is always an array
      if (response.data && Array.isArray(response.data)) {
        console.log('Yanıt bir dizi:', response.data);
        setIlanlar(response.data);
      } else if (response.data && response.data.posts && Array.isArray(response.data.posts)) {
        console.log('Yanıt posts dizisi içeriyor:', response.data.posts);
        setIlanlar(response.data.posts);
      } else {
        console.error('API response is not in the expected format:', response.data);
        console.log('Yanıt tipi:', typeof response.data);
        setIlanlar([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('İlanları getirirken hata:', error);
      console.log('Hata detayları:', error.response ? error.response.data : 'Yanıt yok');
      toast({
        title: 'Hata',
        description: 'İlanlar yüklenirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIlanlar([]); // Set to empty array on error
      setLoading(false);
    }
  };

  const fetchUserApplications = async () => {
    if (!userId || !token) {
      console.log('Kullanıcı bilgileri bulunamadı');
      return;
    }

    try {
      const response = await axios.get(`/api/applications/my-applications`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUserApplications(response.data);
    } catch (error) {
      console.error('Başvuruları getirirken hata:', error);
      toast({
        title: 'Hata',
        description: 'Başvurularınız yüklenirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleIlanClick = (ilan) => {
    try {
      console.log('Selected ilan:', ilan);
      setSelectedIlan(ilan);
      onOpen();
    } catch (error) {
      console.error('Error in handleIlanClick:', error);
      toast({
        title: 'Hata',
        description: 'İlan detayları yüklenirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleApplyClick = async () => {
    try {
      if (!selectedIlan || !token) {
        toast({
          title: 'Hata',
          description: 'Başvuru yapabilmek için giriş yapmanız gerekmektedir.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Check if application period is valid
      const now = new Date();
      const startDate = new Date(selectedIlan.basvuru_baslangic_tarihi);
      const endDate = new Date(selectedIlan.basvuru_bitis_tarihi);

      if (now < startDate) {
        toast({
          title: 'Hata',
          description: 'Başvuru süresi henüz başlamadı.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (now > endDate) {
        toast({
          title: 'Hata',
          description: 'Başvuru süresi sona erdi.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Check if user has already applied
      if (hasApplied(selectedIlan._id)) {
        toast({
          title: 'Bilgi',
          description: 'Bu ilana zaten başvurdunuz.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Başvuru verilerini localStorage'a kaydet
      // Böylece başvuru form sayfasında bu bilgilere erişebiliriz
      localStorage.setItem('selectedIlanId', selectedIlan._id);
      localStorage.setItem('selectedIlanTitle', selectedIlan.ilan_basligi);
      
      // Modal'ı kapat
      onClose();
      
      // Dr. Öğr. Üyesi başvuru formuna yönlendir
      navigate('/dr-ogr-uyesi-basvuru');
      
      toast({
        title: 'Başarılı',
        description: 'Başvuru formuna yönlendiriliyorsunuz.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error in handleApplyClick:', error);
      toast({
        title: 'Hata',
        description: 'Başvuru işlemi sırasında bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const hasApplied = (ilanId) => {
    return userApplications.some(app => app.ilan._id === ilanId);
  };

  const getApplicationStatus = (ilanId) => {
    const application = userApplications.find(app => app.ilan._id === ilanId);
    return application ? application.durum : null;
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Beklemede':
        return (
          <Badge bg={theme.warning} color="white" display="flex" alignItems="center" borderRadius="md" px={2} py={1}>
            <Icon as={FaClock} mr={1} />
            Beklemede
          </Badge>
        );
      case 'Kabul Edildi':
        return (
          <Badge bg={theme.success} color="white" display="flex" alignItems="center" borderRadius="md" px={2} py={1}>
            <Icon as={FaCheck} mr={1} />
            Kabul Edildi
          </Badge>
        );
      case 'Reddedildi':
        return (
          <Badge bg={theme.danger} color="white" display="flex" alignItems="center" borderRadius="md" px={2} py={1}>
            <Icon as={FaTimes} mr={1} />
            Reddedildi
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Beklemede': return theme.warning;
      case 'Kabul Edildi': return theme.success;
      case 'Reddedildi': return theme.danger;
      default: return 'gray.500';
    }
  };

  // İlan kartlarını render et
  const renderIlanCards = () => {
    if (loading) {
      return (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} boxShadow="md" borderRadius="lg" bg="white">
              <CardHeader>
                <Skeleton height="24px" width="80%" />
                <Skeleton height="20px" width="40%" mt={2} />
              </CardHeader>
              <CardBody>
                <Skeleton height="60px" />
              </CardBody>
              <CardFooter>
                <Skeleton height="36px" width="120px" />
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      );
    }

    // Ensure ilanlar is an array before mapping
    const ilanArray = Array.isArray(ilanlar) ? ilanlar : [];
    
    if (ilanArray.length === 0) {
      return (
        <Alert status="info" borderRadius="md" bg={`${theme.light}`}>
          <AlertIcon color={theme.info} />
          <Box>
            <AlertTitle color={theme.primary}>Bilgi</AlertTitle>
            <AlertDescription>Şu anda aktif ilan bulunmamaktadır.</AlertDescription>
          </Box>
        </Alert>
      );
    }

    return (
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
        {ilanArray.map((ilan) => {
          const applied = hasApplied(ilan._id);
          const status = getApplicationStatus(ilan._id);
          
          return (
            <Card 
              key={ilan._id} 
              boxShadow="md" 
              borderRadius="lg"
              borderLeft={applied ? `4px solid ${getStatusColor(status)}` : ''}
              transition="transform 0.2s"
              _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
              bg="white"
              overflow="hidden"
            >
              <CardHeader bg={applied ? `${theme.light}` : 'white'} borderBottom="1px solid" borderColor="gray.100">
                <Heading size="md" color={theme.primary}>{ilan.ilan_basligi}</Heading>
                <HStack mt={2} spacing={2} flexWrap="wrap">
                  <Badge bg={theme.primary} color="white" borderRadius="md" px={2} py={1}>{ilan.kademe}</Badge>
                  {applied && getStatusBadge(status)}
                </HStack>
              </CardHeader>
              <CardBody>
                <Text noOfLines={3}>{ilan.ilan_aciklamasi}</Text>
              </CardBody>
              <CardFooter>
                <Button 
                  leftIcon={<FaEye />}
                  bg={theme.primary}
                  color="white"
                  onClick={() => handleIlanClick(ilan)}
                  _hover={{ bg: theme.info }}
                  boxShadow="sm"
                >
                  Detayları Görüntüle
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </SimpleGrid>
    );
  };

  // Kullanıcı başvurularını render et
  const renderUserApplications = () => {
    // Ensure userApplications is an array
    const userAppsArray = Array.isArray(userApplications) ? userApplications : [];
    
    if (userAppsArray.length === 0) {
      return (
        <Alert status="info" borderRadius="md" bg={`${theme.light}`}>
          <AlertIcon color={theme.info} />
          <Box>
            <AlertTitle color={theme.primary}>Bilgi</AlertTitle>
            <AlertDescription>Henüz bir başvurunuz bulunmamaktadır.</AlertDescription>
          </Box>
        </Alert>
      );
    }

    return (
      <VStack spacing={4} align="stretch">
        {userAppsArray.map((application) => {
          const ilan = application.ilan || {};
          
          return (
            <Card key={application._id || Math.random().toString()} borderRadius="lg" boxShadow="md" bg="white" overflow="hidden">
              <CardHeader bg={`${theme.light}`} borderBottom="1px solid" borderColor="gray.100">
                <Flex justifyContent="space-between" alignItems="center">
                  <Heading size="md" color={theme.primary}>{ilan.ilan_basligi || 'İlan başlığı'}</Heading>
                  {getStatusBadge(application.durum || 'Beklemede')}
                </Flex>
              </CardHeader>
              <CardBody>
                <Stack spacing={4}>
                  <Flex justify="space-between">
                    <Text fontWeight="bold" color={theme.primary}>Başvuru Tarihi:</Text>
                    <Text>{new Date(application.created_at).toLocaleDateString('tr-TR')}</Text>
                  </Flex>
                  <Flex justify="space-between">
                    <Text fontWeight="bold" color={theme.primary}>Kademe:</Text>
                    <Badge bg={theme.primary} color="white" borderRadius="md" px={2} py={1}>{ilan.kademe || 'Belirtilmemiş'}</Badge>
                  </Flex>
                  {application.durum === 'Kabul Edildi' && (
                    <Alert status="success" borderRadius="md" bg={`${theme.success}10`}>
                      <AlertIcon color={theme.success} />
                      <Box>
                        <AlertTitle color={theme.success}>Tebrikler!</AlertTitle>
                        <AlertDescription>Başvurunuz kabul edilmiştir.</AlertDescription>
                      </Box>
                    </Alert>
                  )}
                  {application.puan > 0 && (
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="bold" color={theme.primary}>Puan:</Text>
                      <Badge bg={theme.tertiary} color="white" p={2} borderRadius="md">{application.puan} Puan</Badge>
                    </Flex>
                  )}
                </Stack>
              </CardBody>
              <CardFooter>
                <Button 
                  leftIcon={<FaFileAlt />}
                  bg={theme.primary}
                  color="white"
                  onClick={() => handleIlanClick(ilan)}
                  isDisabled={!ilan._id}
                  _hover={{ bg: theme.info }}
                  boxShadow="sm"
                >
                  İlan Detaylarını Görüntüle
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </VStack>
    );
  };

  // Ana render fonksiyonu
  return (
    <Box minH="100vh" bg={theme.light}>
      <Box bg={theme.primary} color="white" py={6} mb={6} boxShadow="md">
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="lg">Akademik İlan Başvuru Sistemi</Heading>
              <Text mt={2}>Akademik ilerleyişiniz için tüm fırsatlar burada</Text>
            </Box>
            <Flex align="center" bg={`${theme.primary}90`} p={2} borderRadius="md" boxShadow="sm">
              <Avatar size="sm" name={`${userInfo?.ad || ''} ${userInfo?.soyad || ''}`} mr={3} />
              <Text>{userInfo?.ad || ''} {userInfo?.soyad || ''}</Text>
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" pb={10}>
        <Card borderRadius="lg" boxShadow="md" bg="white" overflow="hidden" mb={10}>
          <CardHeader bg={theme.light} py={3} borderBottom="1px solid" borderColor="gray.100">
            <Heading size="md" color={theme.primary}>İlan ve Başvurularınız</Heading>
          </CardHeader>
          <CardBody p={4}>
            <Tabs 
              variant="enclosed"
              colorScheme="blue" 
              isLazy
              index={activeView === 'ilanlar' ? 0 : 1}
              onChange={(index) => setActiveView(index === 0 ? 'ilanlar' : 'basvurular')}
            >
              <TabList>
                <Tab 
                  fontWeight="semibold" 
                  _selected={{ 
                    color: "white", 
                    bg: theme.primary,
                    boxShadow: "none" 
                  }}
                  _hover={{
                    color: theme.primary,
                    bg: `${theme.light}`
                  }}
                >
                  <Icon as={FaFileAlt} mr={2} />
                  Tüm İlanlar
                </Tab>
                <Tab 
                  fontWeight="semibold"
                  _selected={{ 
                    color: "white", 
                    bg: theme.primary,
                    boxShadow: "none" 
                  }}
                  _hover={{
                    color: theme.primary,
                    bg: `${theme.light}`
                  }}
                >
                  <Icon as={FaPaperPlane} mr={2} />
                  Başvurularım
                </Tab>
              </TabList>

              <TabPanels mt={4}>
                <TabPanel p={0}>
                  {renderIlanCards()}
                </TabPanel>
                
                <TabPanel p={0}>
                  {renderUserApplications()}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </Container>

      {/* İlan Detay Modalı */}
      {selectedIlan && (
        <Modal 
          isOpen={isOpen} 
          onClose={onClose} 
          size="xl" 
          scrollBehavior="inside"
          closeOnOverlayClick={true}
        >
          <ModalOverlay />
          <ModalContent borderRadius="lg" boxShadow="xl" overflow="hidden">
            <ModalHeader 
              bg={hasApplied(selectedIlan._id) ? `${theme.light}` : 'white'}
              borderBottom="1px solid"
              borderColor="gray.200"
              py={4}
            >
              <Flex justify="space-between" align="center" wrap="wrap">
                <Text fontSize="xl" fontWeight="bold" color={theme.primary}>{selectedIlan.ilan_basligi}</Text>
                {hasApplied(selectedIlan._id) && getStatusBadge(getApplicationStatus(selectedIlan._id))}
              </Flex>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="start" spacing={6}>
                <Box width="100%">
                  <Heading size="sm" mb={2} color={theme.primary}>İlan Açıklaması</Heading>
                  <Text whiteSpace="pre-wrap">{selectedIlan.ilan_aciklamasi}</Text>
                </Box>
                
                <Divider />
                
                <Box width="100%">
                  <Heading size="sm" mb={2} color={theme.primary}>Kademe</Heading>
                  <Badge bg={theme.primary} color="white" fontSize="md" px={2} py={1} borderRadius="md">{selectedIlan.kademe}</Badge>
                </Box>
                
                <Divider />
                
                <Box width="100%">
                  <Heading size="sm" mb={2} color={theme.primary}>Başvuru Tarihleri</Heading>
                  <Flex justify="space-between" width="100%" flexWrap="wrap">
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color={theme.primary}>Başlangıç:</Text>
                      <Text>{new Date(selectedIlan.basvuru_baslangic_tarihi).toLocaleDateString('tr-TR')}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color={theme.primary}>Bitiş:</Text>
                      <Text>{new Date(selectedIlan.basvuru_bitis_tarihi).toLocaleDateString('tr-TR')}</Text>
                    </Box>
                  </Flex>
                </Box>
                
                <Divider />
                
                <Box width="100%">
                  <Heading size="sm" mb={2} color={theme.primary}>Gerekli Belgeler</Heading>
                  <List spacing={2}>
                    {selectedIlan.required_documents && selectedIlan.required_documents.map((doc, idx) => (
                      <ListItem key={idx}>
                        <ListIcon as={FaFileAlt} color={theme.primary} />
                        {doc}
                      </ListItem>
                    ))}
                  </List>
                </Box>
                
                {selectedIlan.criteria && (
                  <>
                    <Divider />
                    
                    <Box width="100%">
                      <Heading size="sm" mb={2} color={theme.primary}>Değerlendirme Kriterleri</Heading>
                      <VStack align="start" spacing={3} width="100%">
                        {selectedIlan.criteria.criteria && selectedIlan.criteria.criteria.map((criterion, idx) => (
                          <Box key={idx} width="100%">
                            <Flex justify="space-between" mb={1}>
                              <Text>{criterion.name}</Text>
                              <Text fontWeight="bold">{criterion.points} Puan</Text>
                            </Flex>
                            <Progress 
                              value={criterion.points} 
                              max={selectedIlan.criteria.total_minimum_points} 
                              sx={{
                                '& > div': {
                                  background: theme.primary
                                }
                              }}
                              size="sm"
                              borderRadius="full" 
                              bg={theme.light}
                            />
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  </>
                )}
              </VStack>
            </ModalBody>
            
            <ModalFooter bg={theme.light} borderTop="1px solid" borderColor="gray.200">
              {hasApplied(selectedIlan._id) ? (
                <Alert status="info" borderRadius="md" width="100%" bg={`${theme.info}10`}>
                  <AlertIcon color={theme.info} />
                  <Box>
                    <AlertTitle color={theme.info}>Bilgi</AlertTitle>
                    <AlertDescription>
                      Bu ilana zaten başvurdunuz. Başvuru durumunuz: {getStatusBadge(getApplicationStatus(selectedIlan._id))}
                    </AlertDescription>
                  </Box>
                </Alert>
              ) : (
                <Button 
                  bg={theme.success}
                  color="white"
                  width="100%" 
                  leftIcon={<FaPaperPlane />}
                  onClick={handleApplyClick}
                  _hover={{ bg: theme.tertiary }}
                  boxShadow="md"
                >
                  Başvur
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default AdayEkrani;
