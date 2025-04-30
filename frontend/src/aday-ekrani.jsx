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
  FormControl, FormLabel, Input, Select, List, ListItem, ListIcon,
  Center,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { 
  FaFileAlt, FaCheck, FaTimes, FaClock, FaEye, FaPaperPlane, FaUpload, 
  FaFile, FaTrash, FaUserGraduate, FaCalendarAlt, FaClipboardList, 
  FaUniversity, FaBell, FaUserCircle, FaSignOutAlt
} from 'react-icons/fa';

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
  const [selectedJob, setSelectedJob] = useState(null);
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
    try {
      console.log("fetchUserApplications başlatılıyor...");
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/applications/my-applications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log("Başvurular API yanıtı:", response.data);
      
      // Yanıt veri yapısının kontrolü
      if (Array.isArray(response.data.applications)) {
        console.log("Bulunan başvuru sayısı:", response.data.applications.length);
        setUserApplications(response.data.applications);
        console.log("After setState:", userApplications); // This will show the previous state
      } else if (response.data && Array.isArray(response.data)) {
        console.log("Doğrudan dizi olarak dönen başvuru sayısı:", response.data.length);
        setUserApplications(response.data);
      } else {
        console.error("Beklenmeyen API yanıt formatı:", response.data);
        setUserApplications([]); // Boş bir dizi ile devam et
        toast({
          title: "Veri formatı hatası",
          description: "Başvurularınız beklenmeyen bir formatta döndü. Lütfen daha sonra tekrar deneyin.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Başvurular getirme hatası:", error);
      console.error("Hata detayları:", error.response?.data || error.message);
      setUserApplications([]);
      toast({
        title: "Başvurular yüklenemedi",
        description: "Başvurularınız alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIlanClick = (ilan) => {
    try {
      console.log('Selected ilan:', ilan);
      setSelectedJob(ilan);
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
      if (!selectedJob || !token) {
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
      const startDate = new Date(selectedJob.basvuru_baslangic_tarihi);
      const endDate = new Date(selectedJob.basvuru_bitis_tarihi);

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
      if (hasApplied(selectedJob._id)) {
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
      console.log('Debug - selectedJob before localStorage:', selectedJob);
      console.log('Kademe value:', selectedJob.kademe);
      
      localStorage.setItem('selectedJobId', selectedJob._id);
      localStorage.setItem('selectedJobTitle', selectedJob.ilan_basligi);
      localStorage.setItem('selectedJobKademe', selectedJob.kademe);
      
      // Verify localStorage values were set
      console.log('Debug - localStorage after setting:');
      console.log('ID:', localStorage.getItem('selectedJobId'));
      console.log('Title:', localStorage.getItem('selectedJobTitle'));
      console.log('Kademe:', localStorage.getItem('selectedJobKademe'));
      
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

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    navigate('/'); // Navigate to login page
    toast({
      title: 'Çıkış Yapıldı',
      description: 'Başarıyla çıkış yaptınız.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
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
          
          // Kademe'ye göre ikon getiren yardımcı fonksiyon
          const getKademeIcon = (kademe) => {
            switch(kademe) {
              case 'Dr. Öğr. Üyesi': return FaUserGraduate;
              default: return FaUserGraduate;
            }
          };
          
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
                <Flex alignItems="flex-start" mb={2}>
                  <Flex 
                    bg={`${theme.primary}15`} 
                    p={2} 
                    borderRadius="md" 
                    color={theme.primary}
                    mr={3}
                    mt={1}
                  >
                    <Icon as={getKademeIcon(ilan.kademe)} boxSize="18px" />
                  </Flex>
                  <Heading size="md" color={theme.primary}>{ilan.ilan_basligi}</Heading>
                </Flex>
                <HStack mt={2} spacing={2} flexWrap="wrap">
                  <Badge bg={theme.primary} color="white" borderRadius="md" px={2} py={1}>{ilan.kademe}</Badge>
                  <Badge bg={theme.tertiary} color="white" borderRadius="md" px={2} py={1} display="flex" alignItems="center">
                    <Icon as={FaCalendarAlt} mr={1} boxSize="12px" />
                    {new Date(ilan.basvuru_bitis_tarihi).toLocaleDateString('tr-TR', {day: '2-digit', month: '2-digit'})}
                  </Badge>
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
                  w="full"
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
    console.log("renderUserApplications çağrıldı, userApplications:", userApplications);
    
    // userApplications değerinin kontrolü
    if (!userApplications) {
      console.log("userApplications undefined veya null");
      return (
        <Center py={10}>
          <Text>Henüz başvuru bulunmamaktadır.</Text>
        </Center>
      );
    }

    // Array kontrolü
    let userAppsArray = Array.isArray(userApplications) 
      ? userApplications 
      : (userApplications.applications && Array.isArray(userApplications.applications)) 
        ? userApplications.applications 
        : [];
    
    console.log("İşlenecek başvuru dizisi:", userAppsArray);
    console.log("Başvuru sayısı:", userAppsArray.length);

    if (userAppsArray.length === 0) {
      return (
        <Center py={10}>
          <Flex direction="column" align="center">
            <Icon as={FaClipboardList} color={`${theme.primary}60`} fontSize="5xl" mb={4} />
            <Text>Henüz başvuru bulunmamaktadır.</Text>
          </Flex>
        </Center>
      );
    }

    // Başvuruları duruma göre filtreleme
    const pendingApplications = userAppsArray.filter(app => app.durum === "Beklemede");
    const completedApplications = userAppsArray.filter(app => app.durum === "Onaylandı" || app.durum === "Reddedildi");
    
    console.log("Bekleyen başvurular:", pendingApplications.length);
    console.log("Tamamlanmış başvurular:", completedApplications.length);

    return (
      <Box>
        {pendingApplications.length > 0 && (
          <Box mb={6}>
            <Heading size="md" mb={4} display="flex" alignItems="center">
              <Icon as={FaClock} mr={2} color={theme.warning} />
              Bekleyen Başvurularım
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {pendingApplications.map((application) => (
                <Box 
                  key={application._id}
                  borderWidth="1px" 
                  borderRadius="lg" 
                  overflow="hidden" 
                  p={4}
                  boxShadow="md"
                  bg="white"
                  _hover={{ transform: "translateY(-3px)", boxShadow: "lg", transition: "all 0.2s" }}
                  borderLeft={`4px solid ${theme.warning}`}
                >
                  <Flex alignItems="center" mb={2}>
                    <Icon as={FaFileAlt} color={theme.primary} mr={2} />
                    <Heading size="sm">{application.ilan?.ilan_basligi || "Başlık bulunamadı"}</Heading>
                  </Flex>
                  <Text fontSize="sm" color="gray.600" mb={2} display="flex" alignItems="center">
                    <Icon as={FaCalendarAlt} mr={1} fontSize="xs" />
                    Başvuru Tarihi: {new Date(application.created_at || application.basvuru_tarihi).toLocaleDateString('tr-TR')}
                  </Text>
                  <Badge colorScheme="yellow" mb={3} display="flex" alignItems="center" width="fit-content">
                    <Icon as={FaClock} mr={1} fontSize="xs" />
                    Beklemede
                  </Badge>
                  <Button 
                    colorScheme="blue" 
                    size="sm" 
                    onClick={() => {
                      setSelectedJob(application.ilan);
                      onOpen(); // Open the modal instead of changing view
                    }}
                    width="full"
                    mt={2}
                    leftIcon={<FaEye />}
                  >
                    İlan Detaylarını Gör
                  </Button>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        )}

        {completedApplications.length > 0 && (
          <Box>
            <Heading size="md" mb={4} display="flex" alignItems="center">
              <Icon as={FaCheck} mr={2} color={theme.success} />
              Sonuçlanan Başvurularım
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {completedApplications.map((application) => (
                <Box 
                  key={application._id}
                  borderWidth="1px" 
                  borderRadius="lg" 
                  overflow="hidden" 
                  p={4}
                  boxShadow="md"
                  bg="white"
                  _hover={{ transform: "translateY(-3px)", boxShadow: "lg", transition: "all 0.2s" }}
                  borderLeft={`4px solid ${application.durum === "Onaylandı" ? theme.success : theme.danger}`}
                >
                  <Flex alignItems="center" mb={2}>
                    <Icon as={FaFileAlt} color={theme.primary} mr={2} />
                    <Heading size="sm">{application.ilan?.ilan_basligi || "Başlık bulunamadı"}</Heading>
                  </Flex>
                  <Text fontSize="sm" color="gray.600" mb={2} display="flex" alignItems="center">
                    <Icon as={FaCalendarAlt} mr={1} fontSize="xs" />
                    Başvuru Tarihi: {new Date(application.created_at || application.basvuru_tarihi).toLocaleDateString('tr-TR')}
                  </Text>
                  <Badge 
                    colorScheme={application.durum === "Onaylandı" ? "green" : "red"} 
                    mb={3}
                    display="flex"
                    alignItems="center"
                    width="fit-content"
                  >
                    <Icon as={application.durum === "Onaylandı" ? FaCheck : FaTimes} mr={1} fontSize="xs" />
                    {application.durum}
                  </Badge>
                  <Button 
                    colorScheme="blue" 
                    size="sm" 
                    onClick={() => {
                      setSelectedJob(application.ilan);
                      onOpen(); // Open the modal instead of changing view
                    }}
                    width="full"
                    mt={2}
                    leftIcon={<FaEye />}
                  >
                    İlan Detaylarını Gör
                  </Button>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        )}

        {pendingApplications.length === 0 && completedApplications.length === 0 && (
          <Center py={10}>
            <Text>Henüz başvuru bulunmamaktadır.</Text>
          </Center>
        )}
      </Box>
    );
  };

  // Ana render fonksiyonu
  return (
    <Box minH="100vh" bg={theme.light}>
      <Box bg={theme.primary} color="white" py={6} mb={6} boxShadow="md">
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="lg" display="flex" alignItems="center">
                <Icon as={FaUniversity} mr={3} />
                Akademik İlan Başvuru Sistemi
              </Heading>
              <Text mt={2}>Akademik ilerleyişiniz için tüm fırsatlar burada</Text>
            </Box>
            <Flex align="center">
              <Flex align="center" bg={`${theme.primary}90`} p={3} borderRadius="md" boxShadow="sm" mr={3}>
                <Avatar size="sm" name={`${userInfo?.ad || ''} ${userInfo?.soyad || ''}`} mr={3} bg={theme.tertiary} icon={<Icon as={FaUserCircle} />} />
                <Text>{userInfo?.ad || ''} {userInfo?.soyad || ''}</Text>
              </Flex>
              <Tooltip label="Çıkış Yap" placement="bottom">
                <IconButton
                  icon={<Icon as={FaSignOutAlt} />}
                  aria-label="Çıkış Yap"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: `${theme.secondary}90` }}
                  onClick={handleLogout}
                  borderRadius="md"
                  size="md"
                />
              </Tooltip>
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.xl" pb={10}>
        <Card borderRadius="lg" boxShadow="md" bg="white" overflow="hidden" mb={10}>
          <CardHeader bg={theme.light} py={3} borderBottom="1px solid" borderColor="gray.100">
            <Flex align="center">
              <Icon as={FaBell} color={theme.primary} mr={2} />
              <Heading size="md" color={theme.primary}>İlan ve Başvurularınız</Heading>
            </Flex>
          </CardHeader>
          <CardBody p={4}>
            <Tabs 
              variant="enclosed"
              colorScheme="blue" 
              isLazy
              index={activeView === 'ilanlar' ? 0 : 1}
              onChange={(index) => {
                // Set the active view state 
                const newView = index === 0 ? 'ilanlar' : 'basvurular';
                setActiveView(newView);
                
                // If switching to Başvurularım tab, fetch the latest applications
                if (newView === 'basvurular') {
                  fetchUserApplications();
                }
              }}
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
      {selectedJob && (
        <Modal 
          isOpen={isOpen} 
          onClose={onClose} 
          size="xl" 
          scrollBehavior="inside"
          closeOnOverlayClick={true}
        >
          <ModalOverlay bg={`${theme.primary}40`} backdropFilter="blur(1px)" />
          <ModalContent borderRadius="lg" boxShadow="xl" overflow="hidden">
            <ModalHeader 
              bg={hasApplied(selectedJob._id) ? `${theme.light}` : 'white'}
              borderBottom="1px solid"
              borderColor="gray.200"
              py={4}
            >
              <Flex justify="space-between" align="center" wrap="wrap">
                <Flex align="center">
                  <Icon as={FaFileAlt} color={theme.primary} mr={2} />
                  <Text fontSize="xl" fontWeight="bold" color={theme.primary}>{selectedJob.ilan_basligi}</Text>
                </Flex>
                {hasApplied(selectedJob._id) && getStatusBadge(getApplicationStatus(selectedJob._id))}
              </Flex>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="start" spacing={6}>
                <Box width="100%">
                  <Heading size="sm" mb={2} color={theme.primary} display="flex" alignItems="center">
                    <Icon as={FaFileAlt} mr={2} />
                    İlan Açıklaması
                  </Heading>
                  <Text whiteSpace="pre-wrap">{selectedJob.ilan_aciklamasi}</Text>
                </Box>
                
                <Divider />
                
                <Box width="100%">
                  <Heading size="sm" mb={2} color={theme.primary} display="flex" alignItems="center">
                    <Icon as={FaUserGraduate} mr={2} />
                    Kademe
                  </Heading>
                  <Badge bg={theme.primary} color="white" fontSize="md" px={2} py={1} borderRadius="md">{selectedJob.kademe}</Badge>
                </Box>
                
                <Divider />
                
                <Box width="100%">
                  <Heading size="sm" mb={2} color={theme.primary} display="flex" alignItems="center">
                    <Icon as={FaCalendarAlt} mr={2} />
                    Başvuru Tarihleri
                  </Heading>
                  <Flex justify="space-between" width="100%" flexWrap="wrap">
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color={theme.primary}>Başlangıç:</Text>
                      <Text>{new Date(selectedJob.basvuru_baslangic_tarihi).toLocaleDateString('tr-TR')}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" color={theme.primary}>Bitiş:</Text>
                      <Text>{new Date(selectedJob.basvuru_bitis_tarihi).toLocaleDateString('tr-TR')}</Text>
                    </Box>
                  </Flex>
                </Box>
                
                <Divider />
                
                <Box width="100%">
                  <Heading size="sm" mb={2} color={theme.primary} display="flex" alignItems="center">
                    <Icon as={FaClipboardList} mr={2} />
                    Gerekli Belgeler
                  </Heading>
                  <List spacing={2}>
                    {selectedJob.required_documents && selectedJob.required_documents.map((doc, idx) => (
                      <ListItem key={idx}>
                        <ListIcon as={FaFileAlt} color={theme.primary} />
                        {doc}
                      </ListItem>
                    ))}
                  </List>
                </Box>
                
                {selectedJob.criteria && (
                  <>
                    <Divider />
                    
                    <Box width="100%">
                      <Heading size="sm" mb={2} color={theme.primary} display="flex" alignItems="center">
                        <Icon as={FaClipboardList} mr={2} />
                        Değerlendirme Kriterleri
                      </Heading>
                      <VStack align="start" spacing={3} width="100%">
                        {selectedJob.criteria.criteria && selectedJob.criteria.criteria.map((criterion, idx) => (
                          <Box key={idx} width="100%">
                            <Flex justify="space-between" mb={1}>
                              <Text>{criterion.name}</Text>
                              <Text fontWeight="bold">{criterion.points} Puan</Text>
                            </Flex>
                            <Progress 
                              value={criterion.points} 
                              max={selectedJob.criteria.total_minimum_points} 
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
              {hasApplied(selectedJob._id) ? (
                <Alert status="info" borderRadius="md" width="100%" bg={`${theme.info}10`}>
                  <AlertIcon color={theme.info} />
                  <Box>
                    <AlertTitle color={theme.info}>Bilgi</AlertTitle>
                    <AlertDescription>
                      Bu ilana zaten başvurdunuz. Başvuru durumunuz: {getStatusBadge(getApplicationStatus(selectedJob._id))}
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
