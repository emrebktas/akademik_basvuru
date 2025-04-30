import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  CardHeader,
  Container,
  Stack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useToast,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  HStack,
  Divider,
  Tag,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  FormHelperText,
  Icon,
  Center,
  Spinner
} from '@chakra-ui/react';
import { 
  AddIcon, 
  EditIcon, 
  DeleteIcon, 
  ChevronDownIcon, 
  CheckIcon, 
  CloseIcon,
  InfoIcon,
  CalendarIcon
} from '@chakra-ui/icons';
import { 
  FaFileAlt, 
  FaCheck, 
  FaTimes, 
  FaClock, 
  FaEye, 
  FaPaperPlane, 
  FaArrowRight, 
  FaGraduationCap, 
  FaUniversity, 
  FaUserGraduate, 
  FaCalendarAlt, 
  FaClipboardList, 
  FaSearch, 
  FaUpload, 
  FaHandshake, 
  FaClipboardCheck, 
  FaAngleRight,
  FaUsers,
  FaChartBar,
  FaCog,
  FaUserPlus,
  FaTrash,
  FaEdit,
  FaPlus,
  FaFilePdf,
  FaSignOutAlt
} from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Kocaeli Üniversitesi tema renkleri
const theme = {
  primary: "#17468f",    // Koyu Mavi (Ana renk)
  secondary: "#e74c3c",  // Kırmızı (Vurgu rengi)
  tertiary: "#1abc9c",   // Turkuaz (Yardımcı renk)
  light: "#ecf0f1",      // Açık gri  
  success: "#2ecc71",    // Yeşil
  warning: "#f39c12",    // Turuncu
  danger: "#c0392b",     // Koyu kırmızı
  info: "#3498db"        // Açık mavi
};

// İlan oluşturma/düzenleme formu bileşeni
const IlanForm = ({ initialData, onSubmit, isEdit = false }) => {
  const [formData, setFormData] = useState({
    ilan_basligi: '',
    ilan_aciklamasi: '',
    kademe: '',
    basvuru_baslangic_tarihi: '',
    basvuru_bitis_tarihi: '',
    required_documents: [],
    department: '',
    criteria: '',
    fieldGroup: '',
    durum: 'Açık'
  });
  
  // İşlenmemiş tarih değerlerini tutmak için
  const [dateValues, setDateValues] = useState({
    basvuru_baslangic_tarihi: '',
    basvuru_bitis_tarihi: ''
  });

  // Alan Grubu seçenekleri
  const fieldGroupOptions = [
    { value: 'saglik-fen', label: 'Sağlık/Fen/Mat-Müh-Ziraat/Orman/Su Ürünleri' },
    { value: 'egitim-sosyal', label: 'Eğitim/Foloji/Mimarlık-Planlama-Tasarım/SBİB/Spor' },
    { value: 'hukuk-ilahiyat', label: 'Hukuk/İlahiyat' },
    { value: 'guzel-sanatlar', label: 'Güzel Sanatlar' }
  ];

  // Belge seçenekleri
  const documentOptions = [
    'İndeksli Yayın',
    'Atıf Sayısı',
    'Konferans Yayını'
  ];

  useEffect(() => {
    if (initialData) {
      // Tarih verilerini form için düzenleme
      const startDate = initialData.basvuru_baslangic_tarihi ? 
        new Date(initialData.basvuru_baslangic_tarihi).toISOString().split('T')[0] : '';
      const endDate = initialData.basvuru_bitis_tarihi ? 
        new Date(initialData.basvuru_bitis_tarihi).toISOString().split('T')[0] : '';
      
      setFormData({
        ...initialData,
        basvuru_baslangic_tarihi: startDate,
        basvuru_bitis_tarihi: endDate,
        durum: initialData.durum
      });
      
      setDateValues({
        basvuru_baslangic_tarihi: startDate,
        basvuru_bitis_tarihi: endDate
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'basvuru_baslangic_tarihi' || name === 'basvuru_bitis_tarihi') {
      setDateValues({
        ...dateValues,
        [name]: value
      });
    }
    
    // Alan grubu seçildiğinde otomatik olarak criteria değerini de ayarla
    if (name === 'fieldGroup') {
      setFormData({
        ...formData,
        [name]: value,
        criteria: value // Alan grubu değerini criteria alanına da otomatik ekle
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleDocumentChange = (document, isChecked) => {
    let updatedDocs = [...formData.required_documents];
    if (isChecked) {
      if (!updatedDocs.includes(document)) {
        updatedDocs.push(document);
      }
    } else {
      updatedDocs = updatedDocs.filter(doc => doc !== document);
    }
    setFormData({
      ...formData,
      required_documents: updatedDocs
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>İlan Başlığı</FormLabel>
          <Input
            name="ilan_basligi"
            value={formData.ilan_basligi}
            onChange={handleChange}
            placeholder="İlan başlığını girin"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Durum</FormLabel>
          <Select
            name="durum"
            value={formData.durum}
            onChange={e => setFormData({ ...formData, durum: e.target.value })}
          >
            <option value="Açık">Açık</option>
            <option value="Kapalı">Kapalı</option>
            <option value="Tamamlandı">Tamamlandı</option>
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Akademik Kademe</FormLabel>
          <Select
            name="kademe"
            value={formData.kademe}
            onChange={handleChange}
            placeholder="Kademe seçin"
          >
            <option value="Dr. Öğr. Üyesi">Dr. Öğr. Üyesi</option>
            <option value="Doçent">Doçent</option>
            <option value="Profesör">Profesör</option>
          </Select>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Bölüm</FormLabel>
          <Input
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="Bölüm adını girin"
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Alan Grubu</FormLabel>
          <Select
            name="fieldGroup"
            value={formData.fieldGroup}
            onChange={handleChange}
            placeholder="Alan grubu seçin"
          >
            {fieldGroupOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <FormHelperText>
            Alan grubu seçildiğinde kriter bilgisi otomatik olarak atanacaktır.
          </FormHelperText>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>İlan Açıklaması</FormLabel>
          <Textarea
            name="ilan_aciklamasi"
            value={formData.ilan_aciklamasi}
            onChange={handleChange}
            placeholder="İlan detaylarını girin"
            minH="150px"
          />
        </FormControl>

        <SimpleGrid columns={2} spacing={4}>
          <FormControl isRequired>
            <FormLabel>Başvuru Başlangıç Tarihi</FormLabel>
            <Input
              name="basvuru_baslangic_tarihi"
              type="date"
              value={dateValues.basvuru_baslangic_tarihi}
              onChange={handleChange}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Başvuru Bitiş Tarihi</FormLabel>
            <Input
              name="basvuru_bitis_tarihi"
              type="date"
              value={dateValues.basvuru_bitis_tarihi}
              onChange={handleChange}
            />
          </FormControl>
        </SimpleGrid>

        <FormControl>
          <FormLabel>Gerekli Belgeler</FormLabel>
          <VStack align="start" spacing={2}>
            {documentOptions.map((doc) => (
              <Checkbox
                key={doc}
                isChecked={formData.required_documents.includes(doc)}
                onChange={(e) => handleDocumentChange(doc, e.target.checked)}
              >
                {doc}
              </Checkbox>
            ))}
          </VStack>
        </FormControl>

        

        <Button mt={4} colorScheme="blue" type="submit">
          {isEdit ? 'İlanı Güncelle' : 'İlan Oluştur'}
        </Button>
      </VStack>
    </form>
  );
};

// Checkbox bileşeni
const Checkbox = ({ children, isChecked, onChange }) => {
  return (
    <Box display="flex" alignItems="center">
      <Box
        as="label"
        display="flex"
        alignItems="center"
        cursor="pointer"
      >
        <Input
          type="checkbox"
          checked={isChecked}
          onChange={onChange}
          style={{ position: 'absolute', opacity: 0 }}
        />
        <Box
          borderWidth="1px"
          borderRadius="md"
          width="20px"
          height="20px"
          display="flex"
          justifyContent="center"
          alignItems="center"
          mr={2}
          bg={isChecked ? "blue.500" : "white"}
          color="white"
        >
          {isChecked && <CheckIcon boxSize={3} />}
        </Box>
        {children}
      </Box>
    </Box>
  );
};

// Admin ana bileşeni
const AdminEkrani = () => {
  const [ilanlar, setIlanlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIlan, setSelectedIlan] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [bekleyenBasvuruSayisi, setBekleyenBasvuruSayisi] = useState(0);
  const [aktifIlanSayisi, setAktifIlanSayisi] = useState(0);
  const [tamamlanmisBasvurular, setTamamlanmisBasvurular] = useState([]);
  const [kullanicilar, setKullanicilar] = useState([]);
  const [basvuruLoading, setBasvuruLoading] = useState(false);
  const [kullaniciLoading, setKullaniciLoading] = useState(false);
  
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = React.useRef();
  const toast = useToast();
  const navigate = useNavigate();

  const fetchIlanlar = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/applications/get-posts`,
        config
      );
      setIlanlar(response.data);  
      
      const aktifIlanlar = response.data.filter(ilan => ilan.durum === 'Açık');
      setAktifIlanSayisi(aktifIlanlar.length);
      
      setBekleyenBasvuruSayisi(response.data.filter(ilan => ilan.durum === 'Beklemede').length);
    } catch (error) {
      console.error('İlanlar yüklenirken hata oluştu:', error);
      toast({ 
        title: 'Hata',
        description: error.response?.data?.error || 'İlanlar yüklenirken bir hata oluştu.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchTamamlanmisBasvurular = useCallback(async () => {
    setBasvuruLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Önce tüm ilanları getir
      const postsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/applications/get-posts`,
        config
      );
      
      // Her ilan için başvuruları topla
      let allApplications = [];
      
      if (postsResponse.data && postsResponse.data.length > 0) {
        // Her ilana ait başvuruları paralel olarak getir
        const applicationsPromises = postsResponse.data.map(post => 
          axios.get(
            `${import.meta.env.VITE_API_URL}/api/applications/post/${post._id}`,
            config
          )
          .then(response => {
            // İlan bilgilerini başvurulara ekle
            return response.data.map(application => ({
              ...application,
              ilan_detay: {
                ilan_basligi: post.ilan_basligi,
                kademe: post.kademe,
                department: post.department
              }
            }));
          })
          .catch(error => {
            console.error(`Başvurular alınırken hata: ${post._id}`, error);
            return [];
          })
        );
        
        // Tüm başvuruları topla
        const applicationsResponses = await Promise.all(applicationsPromises);
        allApplications = applicationsResponses.flat();
      }
      
      // Tamamlanmış (onaylanmış veya reddedilmiş) başvuruları filtrele
      const tamamlanmis = allApplications.filter(basvuru => 
        basvuru.durum_gecmisi && 
        basvuru.durum_gecmisi.length > 0 && 
        ['Onaylandı', 'Reddedildi'].includes(basvuru.durum_gecmisi[0].durum)
      );
      
      setTamamlanmisBasvurular(tamamlanmis);
    } catch (error) {
      console.error('Başvurular yüklenirken hata oluştu:', error);
      toast({
        title: 'Hata',
        description: error.response?.data?.error || 'Başvurular yüklenirken bir hata oluştu.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setBasvuruLoading(false);
    }
  }, [toast]);

  const fetchKullanicilar = useCallback(async () => {
    setKullaniciLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/yonetici/users`,
        config
      );
      
      setKullanicilar(response.data);
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata oluştu:', error);
      toast({
        title: 'Hata',
        description: error.response?.data?.error || 'Kullanıcılar yüklenirken bir hata oluştu.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setKullaniciLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchIlanlar();
  }, [fetchIlanlar]);

  // Sekme değişikliğini takip etmek için
  const handleTabChange = (index) => {
    if (index === 1 && tamamlanmisBasvurular.length === 0) {
      fetchTamamlanmisBasvurular();
    } else if (index === 2 && kullanicilar.length === 0) {
      fetchKullanicilar();
    }
  };

  const handleCreateIlan = () => {
    setSelectedIlan(null);
    setIsEditing(false);
    onFormOpen();
  };

  const handleEditIlan = (ilan) => {
    setSelectedIlan({
      ...ilan,
      basvuru_baslangic_tarihi: ilan.basvuru_baslangic_tarihi,
      basvuru_bitis_tarihi: ilan.basvuru_bitis_tarihi,
      durum: ilan.durum,
      fieldGroup: ilan.fieldGroup || '',
      criteria: ilan.criteria || ilan.fieldGroup || ''
    });
    setIsEditing(true);
    onFormOpen();
  };

  const handleDeleteClick = (ilan) => {
    setSelectedIlan(ilan);
    onDeleteOpen();
  };

  const handleDeleteIlan = async () => {
    try {
      // Token'ı localStorage'dan al
      const token = localStorage.getItem('token');
      
      // Headers oluştur
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/applications/delete-post/${selectedIlan._id}`,
        config
      );
      toast({
        title: 'İlan Silindi',
        description: 'İlan başarıyla silindi.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      fetchIlanlar();
      onDeleteClose();
    } catch (error) {
      console.error('İlan silinirken hata oluştu:', error);
      toast({
        title: 'Hata',
        description: error.response?.data?.error || 'İlan silinirken bir hata oluştu.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleSubmitForm = async (formData) => {
    try {
      // Token'ı localStorage'dan al
      const token = localStorage.getItem('token');
      
      // Headers oluştur
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      if (isEditing) {
        // İlan güncelleme
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/applications/update-post/${selectedIlan._id}`, 
          formData,
          config
        );
        toast({
          title: 'İlan Güncellendi',
          description: 'İlan başarıyla güncellendi.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        // Yeni ilan oluşturma
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/applications/create-post`, 
          formData,
          config
        );
        toast({
          title: 'İlan Oluşturuldu',
          description: 'Yeni ilan başarıyla oluşturuldu.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
      
      fetchIlanlar();
      onFormClose();
    } catch (error) {
      console.error('İlan kaydedilirken hata oluştu:', error);
      toast({
        title: 'Hata',
        description: error.response?.data?.message || error.response?.data?.error || 'İlan kaydedilirken bir hata oluştu.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Tarih formatını düzenleme
  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  // Durum badge'ı için renk belirleme
  const getDurumColor = (durum) => {
    switch(durum) {
      case 'Açık':
        return 'green';
      case 'Kapalı':
        return 'red';
      case 'Tamamlandı':
        return 'blue';
      case 'Onaylandı':
        return 'green';
      case 'Reddedildi':
        return 'red';
      case 'Beklemede':
        return 'yellow';
      case 'Juri Değerlendirmesinde':
        return 'purple';
      default:
        return 'gray';
    }
  };

  // Başvuru detaylarını görüntüleme fonksiyonu
  const [selectedBasvuru, setSelectedBasvuru] = useState(null);
  const { isOpen: isBasvuruDetailOpen, onOpen: onBasvuruDetailOpen, onClose: onBasvuruDetailClose } = useDisclosure();

  const handleViewBasvuruDetails = (basvuru) => {
    setSelectedBasvuru(basvuru);
    onBasvuruDetailOpen();
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    navigate('/');
    toast({
      title: 'Çıkış Yapıldı',
      description: 'Başarıyla çıkış yaptınız.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box minH="100vh" bg={theme.light}>
      {/* Hero Section */}
      <Box bg={theme.primary} color="white" py={10} mb={10} boxShadow="lg" position="relative" overflow="hidden">
        {/* Decorative Elements */}
        <Box 
          position="absolute" 
          top="-50px" 
          right="-50px" 
          bg={`${theme.secondary}30`}
          borderRadius="full" 
          w="200px" 
          h="200px"
          zIndex="0"
        />
        <Box 
          position="absolute" 
          bottom="-30px" 
          left="-30px" 
          bg={`${theme.tertiary}30`}
          borderRadius="full" 
          w="150px" 
          h="150px"
          zIndex="0"
        />

        <Container maxW="container.xl" position="relative" zIndex="1">
          <Flex justify="space-between" align="center">
            <Box textAlign={{ base: "center", md: "center" }} flexGrow={1}>
              <Heading size="2xl" mb={4}>Admin Paneli</Heading>
              <Divider my={4} borderColor={`${theme.secondary}`} width="60%" mx="auto" opacity="0.5" />
              <Text fontSize="xl" mb={6}>Akademik İlan Yönetim Sistemi</Text>
            </Box>
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
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" pb={20}>
        {/* Statistics Cards */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
          <Card bg="white" boxShadow="md" borderRadius="lg" overflow="hidden" position="relative">
            <Box 
              position="absolute" 
              top="-20px" 
              right="-20px" 
              bg={`${theme.primary}10`}
              borderRadius="full" 
              w="80px" 
              h="80px"
              zIndex="0"
            />
            <CardBody position="relative" zIndex="1">
              <Stat>
                <Flex align="center" mb={4}>
                  <Flex 
                    bg={`${theme.primary}20`} 
                    p={2} 
                    borderRadius="full" 
                    color={theme.primary}
                    mr={3}
                    boxSize="40px"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FaFileAlt} boxSize="20px" />
                  </Flex>
                  <StatLabel fontSize="lg">Toplam İlan</StatLabel>
                </Flex>
                <StatNumber color={theme.primary}>{ilanlar.length}</StatNumber>
                <StatHelpText>Aktif ve pasif tüm ilanlar</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="white" boxShadow="md" borderRadius="lg" overflow="hidden" position="relative">
            <Box 
              position="absolute" 
              top="-20px" 
              right="-20px" 
              bg={`${theme.info}10`}
              borderRadius="full" 
              w="80px" 
              h="80px"
              zIndex="0"
            />
            <CardBody position="relative" zIndex="1">
              <Stat>
                <Flex align="center" mb={4}>
                  <Flex 
                    bg={`${theme.info}20`} 
                    p={2} 
                    borderRadius="full" 
                    color={theme.info}
                    mr={3}
                    boxSize="40px"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FaUsers} boxSize="20px" />
                  </Flex>
                  <StatLabel fontSize="lg">Toplam Başvuru</StatLabel>
                </Flex>
                <StatNumber color={theme.info}>{bekleyenBasvuruSayisi + tamamlanmisBasvurular.length}</StatNumber>
                <StatHelpText>Tüm başvurular</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="white" boxShadow="md" borderRadius="lg" overflow="hidden" position="relative">
            <Box 
              position="absolute" 
              top="-20px" 
              right="-20px" 
              bg={`${theme.warning}10`}
              borderRadius="full" 
              w="80px" 
              h="80px"
              zIndex="0"
            />
            <CardBody position="relative" zIndex="1">
              <Stat>
                <Flex align="center" mb={4}>
                  <Flex 
                    bg={`${theme.warning}20`} 
                    p={2} 
                    borderRadius="full" 
                    color={theme.warning}
                    mr={3}
                    boxSize="40px"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FaClock} boxSize="20px" />
                  </Flex>
                  <StatLabel fontSize="lg">Bekleyen Başvuru</StatLabel>
                </Flex>
                <StatNumber color={theme.warning}>{bekleyenBasvuruSayisi}</StatNumber>
                <StatHelpText>Değerlendirme bekleyen</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="white" boxShadow="md" borderRadius="lg" overflow="hidden" position="relative">
            <Box 
              position="absolute" 
              top="-20px" 
              right="-20px" 
              bg={`${theme.tertiary}10`}
              borderRadius="full" 
              w="80px" 
              h="80px"
              zIndex="0"
            />
            <CardBody position="relative" zIndex="1">
              <Stat>
                <Flex align="center" mb={4}>
                  <Flex 
                    bg={`${theme.tertiary}20`} 
                    p={2} 
                    borderRadius="full" 
                    color={theme.tertiary}
                    mr={3}
                    boxSize="40px"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FaClipboardCheck} boxSize="20px" />
                  </Flex>
                  <StatLabel fontSize="lg">Aktif İlan</StatLabel>
                </Flex>
                <StatNumber color={theme.tertiary}>{aktifIlanSayisi}</StatNumber>
                <StatHelpText>Başvuruya açık</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Main Card with Tabs */}
        <Card borderRadius="lg" boxShadow="md" bg="white" overflow="hidden" position="relative">
          <Box 
            position="absolute" 
            top="-30px" 
            right="-30px" 
            bg={`${theme.tertiary}10`}
            borderRadius="full" 
            w="120px" 
            h="120px"
            zIndex="0"
          />
          <CardHeader bg={theme.light} py={4} borderBottom="1px solid" borderColor="gray.100" position="relative" zIndex="1">
            <Flex align="center">
              <Flex 
                bg={`${theme.primary}20`} 
                p={2} 
                borderRadius="full" 
                color={theme.primary}
                mr={3}
                boxSize="40px"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={FaClipboardList} boxSize="20px" />
              </Flex>
              <Heading size="lg" color={theme.primary}>İlan Yönetimi</Heading>
            </Flex>
          </CardHeader>
          <CardBody p={6}>
            <Tabs colorScheme="blue" onChange={handleTabChange}>
              <TabList mb={4}>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FaFileAlt} />
                    <Text>İlanlar</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FaUsers} />
                    <Text>Başvurular</Text>
                  </HStack>
                </Tab>
                <Tab>
                  <HStack spacing={2}>
                    <Icon as={FaUserGraduate} />
                    <Text>Kullanıcılar</Text>
                  </HStack>
                </Tab>
              </TabList>

              <TabPanels>
                {/* İlanlar Tab Panel */}
                <TabPanel p={0}>
                  <Flex justifyContent="space-between" alignItems="center" mb={4}>
                    <Button 
                      leftIcon={<Icon as={FaPlus} />} 
                      bg={theme.primary}
                      color="white"
                      _hover={{ bg: theme.info }}
                      onClick={handleCreateIlan}
                    >
                      Yeni İlan
                    </Button>
                  </Flex>

                  {loading ? (
                    <Center p={8}>
                      <Spinner size="xl" color={theme.primary} />
                    </Center>
                  ) : (
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>İlan Başlığı</Th>
                          <Th>Kademe</Th>
                          <Th>Durum</Th>
                          <Th>Başlangıç</Th>
                          <Th>Bitiş</Th>
                          <Th>İşlemler</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {ilanlar.map((ilan) => (
                          <Tr key={ilan._id}>
                            <Td>{ilan.ilan_basligi}</Td>
                            <Td>{ilan.kademe}</Td>
                            <Td>
                              <Badge 
                                bg={getDurumColor(ilan.durum)} 
                                color="white"
                                borderRadius="md"
                                px={2}
                                py={1}
                              >
                                {ilan.durum}
                              </Badge>
                            </Td>
                            <Td>{formatDate(ilan.basvuru_baslangic_tarihi)}</Td>
                            <Td>{formatDate(ilan.basvuru_bitis_tarihi)}</Td>
                            <Td>
                              <HStack spacing={2}>
                                <IconButton
                                  icon={<Icon as={FaEdit} />}
                                  aria-label="Düzenle"
                                  bg={theme.info}
                                  color="white"
                                  _hover={{ bg: theme.primary }}
                                  onClick={() => handleEditIlan(ilan)}
                                />
                                <IconButton
                                  icon={<Icon as={FaTrash} />}
                                  aria-label="Sil"
                                  bg={theme.danger}
                                  color="white"
                                  _hover={{ bg: theme.secondary }}
                                  onClick={() => handleDeleteClick(ilan)}
                                />
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </TabPanel>

                {/* Başvurular Tab Panel */}
                <TabPanel p={0}>
                  <Card>
                    <CardHeader>
                      <Flex justifyContent="space-between" alignItems="center">
                        <Heading size="md">Tamamlanmış Başvurular</Heading>
                        <Button 
                          colorScheme="blue" 
                          size="sm" 
                          leftIcon={<InfoIcon />}
                          onClick={fetchTamamlanmisBasvurular}
                          isLoading={basvuruLoading}
                        >
                          Güncelle
                        </Button>
                      </Flex>
                    </CardHeader>
                    <CardBody>
                      {basvuruLoading ? (
                        <Text>Yükleniyor...</Text>
                      ) : tamamlanmisBasvurular.length === 0 ? (
                        <Text>Henüz tamamlanmış başvuru bulunmamaktadır.</Text>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>İlan Başlığı</Th>
                              <Th>Bölüm</Th>
                              <Th>Kademe</Th>
                              <Th>Aday</Th>
                              <Th>Başvuru Tarihi</Th>
                              <Th>Durum</Th>
                              <Th>İşlemler</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {tamamlanmisBasvurular.map((basvuru) => (
                              <Tr key={basvuru._id}>
                                <Td>{basvuru.ilan_detay?.ilan_basligi || basvuru.ilan_id?.ilan_basligi || 'Belirtilmemiş'}</Td>
                                <Td>{basvuru.ilan_detay?.department || basvuru.ilan_id?.department || 'Belirtilmemiş'}</Td>
                                <Td>{basvuru.ilan_detay?.kademe || basvuru.ilan_id?.kademe || 'Belirtilmemiş'}</Td>
                                <Td>{basvuru.aday_id ? `${basvuru.aday_id.ad} ${basvuru.aday_id.soyad}` : 'Belirtilmemiş'}</Td>
                                <Td>{formatDate(basvuru.created_at)}</Td>
                                <Td>
                                  <Badge colorScheme={getDurumColor(basvuru.durum_gecmisi[0].durum)}>
                                    {basvuru.durum_gecmisi[0].durum}
                                  </Badge>
                                </Td>
                                <Td>
                                  <HStack spacing={2}>
                                    <Tooltip label="Detayları Görüntüle">
                                      <IconButton
                                        icon={<InfoIcon />}
                                        aria-label="Detaylar"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewBasvuruDetails(basvuru)}
                                      />
                                    </Tooltip>
                                  </HStack>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}
                    </CardBody>
                  </Card>
                </TabPanel>

                {/* Kullanıcılar Tab Panel */}
                <TabPanel p={0}>
                  <Card>
                    <CardHeader>
                      <Heading size="md">Sistem Kullanıcıları</Heading>
                    </CardHeader>
                    <CardBody>
                      {kullaniciLoading ? (
                        <Text>Yükleniyor...</Text>
                      ) : kullanicilar.length === 0 ? (
                        <Text>Henüz kullanıcı bulunmamaktadır.</Text>
                      ) : (
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Ad Soyad</Th>
                              <Th>Rol</Th>
                              <Th>E-posta</Th>
                              <Th>Bölüm</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {kullanicilar.map((kullanici) => (
                              <Tr key={kullanici._id}>
                                <Td>{kullanici.name || `${kullanici.ad || ''} ${kullanici.soyad || ''}`}</Td>
                                <Td>
                                  <Badge colorScheme={
                                    kullanici.role === 'Admin' || kullanici.rol === 'Admin' ? 'red' :
                                    kullanici.role === 'Yonetici' || kullanici.rol === 'Yonetici' ? 'purple' :
                                    kullanici.role === 'Juri' || kullanici.rol === 'Juri' ? 'blue' : 
                                    'green'
                                  }>
                                    {kullanici.role || kullanici.rol}
                                  </Badge>
                                </Td>
                                <Td>{kullanici.email || 'Belirtilmemiş'}</Td>
                                <Td>{kullanici.department || 'Belirtilmemiş'}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}
                    </CardBody>
                  </Card>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </Container>

      {/* Modals with updated styling */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="xl">
        <ModalOverlay bg={`${theme.primary}40`} backdropFilter="blur(2px)" />
        <ModalContent borderRadius="lg">
          <ModalHeader bg={theme.light} borderBottom="1px solid" borderColor="gray.200">
            <Flex align="center">
              <Flex 
                bg={`${theme.primary}20`} 
                p={2} 
                borderRadius="full" 
                color={theme.primary}
                mr={3}
                boxSize="40px"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={isEditing ? FaEdit : FaPlus} boxSize="20px" />
              </Flex>
              <Text>{isEditing ? 'İlan Düzenle' : 'Yeni İlan Oluştur'}</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <IlanForm 
              initialData={selectedIlan} 
              onSubmit={handleSubmitForm}
              isEdit={isEditing}
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Silme Onay Dialogu */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              İlanı Sil
            </AlertDialogHeader>

            <AlertDialogBody>
              Bu ilanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                İptal
              </Button>
              <Button colorScheme="red" onClick={handleDeleteIlan} ml={3}>
                Sil
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Başvuru Detayları Modalı */}
      <Modal isOpen={isBasvuruDetailOpen} onClose={onBasvuruDetailClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Başvuru Detayları</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedBasvuru && (
              <VStack spacing={4} align="stretch">
                <Flex justifyContent="space-between">
                  <Box>
                    <Text fontWeight="bold">İlan Bilgileri</Text>
                    <Text>{selectedBasvuru.ilan_detay?.ilan_basligi || selectedBasvuru.ilan_id?.ilan_basligi || 'Belirtilmemiş'}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {selectedBasvuru.ilan_detay?.department || selectedBasvuru.ilan_id?.department || 'Belirtilmemiş'} - 
                      {selectedBasvuru.ilan_detay?.kademe || selectedBasvuru.ilan_id?.kademe || 'Belirtilmemiş'}
                    </Text>
                  </Box>
                  <Badge colorScheme={getDurumColor(selectedBasvuru.durum_gecmisi[0].durum)}>
                    {selectedBasvuru.durum_gecmisi[0].durum}
                  </Badge>
                </Flex>
                
                <Divider />
                
                <Box>
                  <Text fontWeight="bold">Aday Bilgileri</Text>
                  <Text>{selectedBasvuru.aday_id ? `${selectedBasvuru.aday_id.ad} ${selectedBasvuru.aday_id.soyad}` : 'Belirtilmemiş'}</Text>
                  {selectedBasvuru.aday_id?.tc_kimlik_no && (
                    <Text fontSize="sm" color="gray.600">TC: {selectedBasvuru.aday_id.tc_kimlik_no}</Text>
                  )}
                </Box>
                
                <Divider />
                
                <Box>
                  <Text fontWeight="bold">Başvuru Durumu</Text>
                  <VStack align="start" spacing={2} mt={2}>
                    {selectedBasvuru.durum_gecmisi.map((durum, index) => (
                      <HStack key={index} spacing={3}>
                        <Badge colorScheme={getDurumColor(durum.durum)}>
                          {durum.durum}
                        </Badge>
                        <Text fontSize="sm">{formatDate(durum.tarih)}</Text>
                        {durum.aciklama && <Text fontSize="sm" color="gray.600">{durum.aciklama}</Text>}
                      </HStack>
                    ))}
                  </VStack>
                </Box>
                
                {selectedBasvuru.puan !== null && selectedBasvuru.puan !== undefined && (
                  <>
                    <Divider />
                    <Box>
                      <Text fontWeight="bold">Puanlama</Text>
                      <Stat mt={2}>
                        <StatNumber>{selectedBasvuru.puan}</StatNumber>
                        <StatHelpText>Değerlendirme Puanı</StatHelpText>
                      </Stat>
                    </Box>
                  </>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onBasvuruDetailClose}>Kapat</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminEkrani;
