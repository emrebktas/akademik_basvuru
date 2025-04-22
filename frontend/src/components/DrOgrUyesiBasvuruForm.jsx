import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  VStack,
  Progress,
  Heading,
  Text,
  Alert,
  AlertIcon,
  useToast,
  Input,
  NumberInput,
  NumberInputField,
  HStack,
  FormErrorMessage,
  Container,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Badge,
  IconButton,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  AlertTitle,
  AlertDescription,
  UnorderedList,
  ListItem,
  FormHelperText,
  Checkbox,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Spinner,
  Flex,
  Grid,
  GridItem,
  Spacer,
  Stack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Center,
  Link,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, DeleteIcon, AddIcon, DownloadIcon, ViewIcon } from '@chakra-ui/icons';

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

const DrOgrUyesiBasvuruForm = () => {
  const navigate = useNavigate();
  // Get the ilan information from localStorage that was set in the AdayEkrani component
  const ilanID = localStorage.getItem('selectedIlanId') || '';
  const ilanBasligi = localStorage.getItem('selectedIlanTitle') || '';
  const [currentStep, setCurrentStep] = useState(0);
  const [fieldGroup, setFieldGroup] = useState('');
  const [formData, setFormData] = useState({
    adSoyad: '',
    dilSinavi: '',
    dilPuani: ''
  });
  
  // Add new state variables for academic activities
  const [projects, setProjects] = useState([]);
  const [books, setBooks] = useState([]);
  const [citations, setCitations] = useState([]);
  const [presentations, setPresentations] = useState([]);
  const [awards, setAwards] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [publications, setPublications] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [criteria, setCriteria] = useState(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Add new state for publication form
  const [newPublication, setNewPublication] = useState({
    category: '',
    index: '',
    doi: '',
    title: '',
    publicationYear: '',
    isMainAuthor: false
  });

  // Add new state for PDF preview
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const fieldGroups = {
    'saglik-fen': 'Sağlık/Fen/Mat-Müh-Ziraat/Orman/Su Ürünleri',
    'egitim-sosyal': 'Eğitim/Foloji/Mimarlık-Planlama-Tasarım/SBİB/Spor',
    'hukuk-ilahiyat': 'Hukuk/İlahiyat',
    'guzel-sanatlar': 'Güzel Sanatlar'
  };

  const acceptedLanguageExams = [
    'YDS',
    'YÖKDİL',
    'TOEFL iBT',
    'IELTS'
  ];

  const categories = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8'];

  // Constants for academic activities
  const PROJECT_TYPES = ['TÜBİTAK', 'AB', 'BAP', 'Diğer'];
  const PROJECT_ROLES = ['Yürütücü', 'Araştırmacı', 'Danışman'];
  const BOOK_TYPES = ['Kitap', 'Kitap Bölümü'];
  const CITATION_INDEXES = ['WoS', 'Scopus'];
  const PRESENTATION_TYPES = ['Sözlü', 'Poster'];

  // Kategori-İndeks eşleştirme haritası
  const categoryIndexMap = {
    'A1': 'Q1', // SCI-E, SSCI veya AHCI kapsamındaki dergiler (Q1) - 60 puan
    'A2': 'Q2', // SCI-E, SSCI veya AHCI kapsamındaki dergiler (Q2) - 55 puan
    'A3': 'Q3', // SCI-E, SSCI veya AHCI kapsamındaki dergiler (Q3) - 40 puan
    'A4': 'Q4', // SCI-E, SSCI veya AHCI kapsamındaki dergiler (Q4) - 30 puan
    'A5': 'ESCI', // ESCI tarafından taranan dergiler - 25 puan
    'A6': 'Scopus', // Scopus tarafından taranan dergiler - 20 puan
    'A7': 'Diğer', // Uluslararası diğer indekslerde taranan dergiler - 15 puan
    'A8': 'TR Dizin' // ULAKBİM TR Dizin tarafından taranan dergiler - 10 puan
  };

  // Kategori açıklamaları
  const categoryDescriptions = {
    'A1': 'SCI-E, SSCI veya AHCI kapsamındaki Q1 dergileri (60 puan)',
    'A2': 'SCI-E, SSCI veya AHCI kapsamındaki Q2 dergileri (55 puan)',
    'A3': 'SCI-E, SSCI veya AHCI kapsamındaki Q3 dergileri (40 puan)',
    'A4': 'SCI-E, SSCI veya AHCI kapsamındaki Q4 dergileri (30 puan)',
    'A5': 'ESCI tarafından taranan dergiler (25 puan)',
    'A6': 'Scopus tarafından taranan dergiler (20 puan)',
    'A7': 'Uluslararası diğer indekslerde taranan dergiler (15 puan)',
    'A8': 'ULAKBİM TR Dizin tarafından taranan dergiler (10 puan)'
  };

  // Yayın yılı seçenekleri için dizi oluştur (1900'den 2025'e kadar)
  const generateYearOptions = () => {
    const years = [];
    for (let year = 2025; year >= 1900; year--) {
      years.push(year);
    }
    return years;
  };

  const yearOptions = generateYearOptions();

  // Fetch criteria when field group changes
  useEffect(() => {
    if (fieldGroup) {
      fetchCriteria(fieldGroup);
    }
  }, [fieldGroup]);

  // Calculate total points based on publications
  useEffect(() => {
    calculateTotalPoints();
  }, [publications]);

  const calculateTotalPoints = () => {
    console.log("Publications to calculate points:", publications);
    let points = 0;
    
    // Her kategori için önceden belirlenmiş puan değerlerini kullan
    publications.forEach(pub => {
      console.log("Processing publication:", pub);
      console.log("Category:", pub.category, "isMainAuthor:", pub.isMainAuthor);
      
      // Kategori bazlı puanlama
      let categoryPoints = 0;
      switch(pub.category) {
        case 'A1': categoryPoints = 60; break; // Q1
        case 'A2': categoryPoints = 55; break; // Q2
        case 'A3': categoryPoints = 40; break; // Q3
        case 'A4': categoryPoints = 30; break; // Q4
        case 'A5': categoryPoints = 25; break; // ESCI
        case 'A6': categoryPoints = 20; break; // Scopus
        case 'A7': categoryPoints = 15; break; // Diğer Uluslararası
        case 'A8': categoryPoints = 10; break; // TR Dizin
        default: categoryPoints = 5; break;
      }
      
      console.log("Points from category:", categoryPoints);
      
      // Ana yazar bonus puanı
      let authorPoints = pub.isMainAuthor ? 10 : 0;
      console.log("Bonus points for main author:", authorPoints);
      
      points += categoryPoints + authorPoints;
      console.log("Total points so far:", points);
    });
    
    console.log("Final total points:", points);
    setTotalPoints(points);
    
    // Debug için - getPublicationStats fonksiyonunu çağırıp puanları kontrol edelim
    const stats = getPublicationStats();
    console.log("Debug - Publication Statistics:", stats);
    console.log("A1-A4 Points:", stats.a1a4Points);
    console.log("A1-A5 Points:", stats.a1a5Points);
  };

  const fetchCriteria = async (fieldGroupValue) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/criteria/${fieldGroupValue}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data) {
        setCriteria(response.data);
      }
    } catch (error) {
      console.error('Kriter bilgileri alınamadı:', error);
      toast({
        title: 'Hata',
        description: 'Temel alan kriterlerini alırken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldGroupChange = (e) => {
    setFieldGroup(e.target.value);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getPublicationStats = () => {
    console.log("Running getPublicationStats with publications:", publications);
    
    const a1a2Publications = publications.filter(p => ['A1', 'A2'].includes(p.category));
    console.log("A1-A2 Publications:", a1a2Publications);
    
    const a1a4Publications = publications.filter(p => ['A1', 'A2', 'A3', 'A4'].includes(p.category));
    console.log("A1-A4 Publications:", a1a4Publications);
    
    const a1a5Publications = publications.filter(p => ['A1', 'A2', 'A3', 'A4', 'A5'].includes(p.category));
    console.log("A1-A5 Publications:", a1a5Publications);
    
    // Calculate points for A1-A4 publications
    const a1a4Points = a1a4Publications.reduce((total, pub) => {
      let points = 0;
      switch(pub.category) {
        case 'A1': points = 60; break;
        case 'A2': points = 55; break;
        case 'A3': points = 40; break;
        case 'A4': points = 30; break;
        default: break;
      }
      if (pub.isMainAuthor) points += 10;
      console.log(`A1-A4 publication ${pub.title}: category ${pub.category} = ${points} points (isMainAuthor: ${pub.isMainAuthor})`);
      return total + points;
    }, 0);
    console.log("Total A1-A4 Points:", a1a4Points);

    // Calculate points for A1-A5 publications
    const a1a5Points = a1a5Publications.reduce((total, pub) => {
      let points = 0;
      switch(pub.category) {
        case 'A1': points = 60; break;
        case 'A2': points = 55; break;
        case 'A3': points = 40; break;
        case 'A4': points = 30; break;
        case 'A5': points = 25; break;
        default: break;
      }
      if (pub.isMainAuthor) points += 10;
      console.log(`A1-A5 publication ${pub.title}: category ${pub.category} = ${points} points (isMainAuthor: ${pub.isMainAuthor})`);
      return total + points;
    }, 0);
    console.log("Total A1-A5 Points:", a1a5Points);
    
    return {
      a1a2Count: a1a2Publications.length,
      a1a4Count: a1a4Publications.length,
      a1a5Count: a1a5Publications.length,
      mainAuthorCount: publications.filter(p => p.isMainAuthor).length,
      totalCount: publications.length,
      a1a4Points: a1a4Points,
      a1a5Points: a1a5Points
    };
  };

  const isValidStep = () => {
    switch (currentStep) {
      case 0:
        return fieldGroup !== '';
      
      case 1:
        return formData.adSoyad !== '' && 
               formData.dilSinavi !== '' && 
               formData.dilPuani !== '' && 
               (criteria ? Number(formData.dilPuani) >= criteria.minLanguageScore : Number(formData.dilPuani) >= 65);
      
      case 2: {
        if (!criteria) return false;
        
        const stats = getPublicationStats();
        const { publicationCriteria, pointCriteria } = criteria;
        
        return stats.totalCount >= publicationCriteria.minTotalPublications && 
               stats.a1a2Count >= publicationCriteria.minA1A2Publications && 
               stats.a1a4Count >= publicationCriteria.minA1A4Publications &&
               stats.a1a5Count >= publicationCriteria.minA1A5Publications &&
               stats.mainAuthorCount >= publicationCriteria.minMainAuthorPublications &&
               stats.a1a4Points >= publicationCriteria.minA1A4Points &&
               stats.a1a5Points >= publicationCriteria.minA1A5Points &&
               totalPoints >= pointCriteria.minPoints &&
               totalPoints <= pointCriteria.maxPoints;
      }
      
      case 3:
        // Bu adım için tüm akademik faaliyetler opsiyonel olabilir
        return true;
      
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (!isValidStep()) {
      toast({
        title: 'Uyarı',
        description: currentStep === 0 
          ? 'Lütfen temel alanınızı seçiniz.'
          : currentStep === 1 
            ? 'Lütfen tüm alanları doldurunuz ve dil puanının 65 veya üzeri olduğundan emin olunuz.'
            : 'Lütfen tüm gereksinimleri karşılayınız.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (currentStep === 3) {
      handleSubmitApplication();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Handle publication form input changes
  const handlePublicationInputChange = (field, value) => {
    if (field === 'category') {
      // Eğer kategori değişirse, indeksi otomatik olarak güncelle
      setNewPublication(prev => ({
        ...prev,
        [field]: value,
        index: categoryIndexMap[value] // Kategori-indeks eşleştirmesi
      }));
    } else {
      setNewPublication(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Handle publication submission
  const handleAddPublication = async () => {
    try {
      // Form validasyonu
      if (!newPublication.category || !newPublication.index || !newPublication.title || 
          !newPublication.doi || !newPublication.publicationYear || !selectedFile) {
        toast({
          title: 'Hata',
          description: 'Lütfen tüm zorunlu alanları doldurun ve bir PDF dosyası seçin.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      let formData = new FormData();
      formData.append('category', newPublication.category);
      formData.append('index', newPublication.index);
      formData.append('title', newPublication.title);
      formData.append('doi', newPublication.doi);
      formData.append('publicationYear', newPublication.publicationYear);
      formData.append('isMainAuthor', newPublication.isMainAuthor || false);
      formData.append('pdfFile', selectedFile);
      formData.append('ilan_id', ilanID);

      // Debug için formData içeriğini kontrol et
      for (let [key, value] of formData.entries()) {
        console.log(`FormData içeriği - ${key}:`, value);
      }

      console.log('İlan ID:', ilanID);

      const response = await axios.post('/api/publications/add', formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      console.log('Sunucu yanıtı:', response.data);

      if (response.data.success) {
        // Backend'den gelen yayın nesnesini kontrol et
        const newPub = response.data.publication;
        console.log('Eklenecek yeni yayın:', newPub);
        
        // Kategori ve isMainAuthor özelliklerinin string yerine doğru tipte olduğundan emin olalım
        const processedPublication = {
          ...newPub,
          // Kategori string olmalı, değilse varsayılanı kullan
          category: typeof newPub.category === 'string' ? newPub.category : newPublication.category,
          // isMainAuthor boolean olmalı, değilse string 'true' değerini boolean'a çevirelim
          isMainAuthor: typeof newPub.isMainAuthor === 'boolean' ? 
                        newPub.isMainAuthor : 
                        newPub.isMainAuthor === 'true' || newPub.isMainAuthor === true
        };
        
        console.log('İşlenmiş yayın:', processedPublication);
        
        // Yayın listesini güncelle
        setPublications([...publications, processedPublication]);
        
        // Formu temizle
        setNewPublication({
          category: '',
          index: '',
          title: '',
          doi: '',
          publicationYear: '',
          isMainAuthor: false
        });
        setSelectedFile(null);
        
        // Dosya input'unu temizle
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
          fileInput.value = '';
        }

        toast({
          title: 'Başarılı',
          description: 'Yayın başarıyla eklendi.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Yayın ekleme hatası:', error);
      console.log('Hata detayları:', error.response?.data);
      
      toast({
        title: 'Hata',
        description: error.response?.data?.error || 'Yayın eklenirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDeletePublication = async (index) => {
    try {
      const publicationId = publications[index]._id;
      await axios.delete(`/api/publications/${publicationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setPublications(publications.filter((_, i) => i !== index));
      toast({
        title: 'Başarılı',
        description: 'Yayın başarıyla silindi.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Yayın silme hatası:', err);
      toast({
        title: 'Hata',
        description: 'Yayın silinirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmitApplication = async () => {
    try {
      const applicationData = {
        academic_post: ilanID,
        fieldGroup,
        languageExam: {
          type: formData.dilSinavi,
          score: Number(formData.dilPuani)
        },
        publications: publications.map(p => p._id),
        projects: projects.map(p => p._id),
        books: books.map(b => b._id),
        citations: citations.map(c => c._id),
        presentations: presentations.map(p => p._id),
        awards: awards.map(a => a._id)
      };

      const response = await axios.post('/api/applications/submit', applicationData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        toast({
          title: 'Başarılı',
          description: 'Başvurunuz başarıyla gönderildi.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Clear localStorage
        localStorage.removeItem('selectedIlanId');
        localStorage.removeItem('selectedIlanTitle');
        
        // Navigate back to the applications listing
        navigate('/aday-ekrani');
      }
    } catch (err) {
      console.error('Başvuru gönderme hatası:', err);
      toast({
        title: 'Hata',
        description: 'Başvuru gönderilirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Add handlers for academic activities
  const handleAddProject = async (projectData) => {
    try {
      const formData = new FormData();
      Object.entries(projectData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      if (selectedFile) {
        formData.append('proofFile', selectedFile);
      }

      const response = await axios.post('/api/academic-activities/projects', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setProjects([...projects, response.data.project]);
      setSelectedFile(null);
      toast({
        title: 'Başarılı',
        description: 'Proje başarıyla eklendi.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Proje ekleme hatası:', error);
      toast({
        title: 'Hata',
        description: 'Proje eklenirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddBook = async (bookData) => {
    try {
      const formData = new FormData();
      Object.entries(bookData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      if (selectedFile) {
        formData.append('proofFile', selectedFile);
      }

      const response = await axios.post('/api/academic-activities/books', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setBooks([...books, response.data.book]);
      setSelectedFile(null);
      toast({
        title: 'Başarılı',
        description: 'Kitap başarıyla eklendi.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Kitap ekleme hatası:', error);
      toast({
        title: 'Hata',
        description: 'Kitap eklenirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddCitation = async (citationData) => {
    try {
      const formData = new FormData();
      Object.entries(citationData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      if (selectedFile) {
        formData.append('proofFile', selectedFile);
      }

      const response = await axios.post('/api/academic-activities/citations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setCitations([...citations, response.data.citation]);
      setSelectedFile(null);
      toast({
        title: 'Başarılı',
        description: 'Atıf başarıyla eklendi.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Atıf ekleme hatası:', error);
      toast({
        title: 'Hata',
        description: 'Atıf eklenirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddPresentation = async (presentationData) => {
    try {
      const formData = new FormData();
      Object.entries(presentationData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      if (selectedFile) {
        formData.append('proofFile', selectedFile);
      }

      const response = await axios.post('/api/academic-activities/presentations', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setPresentations([...presentations, response.data.presentation]);
      setSelectedFile(null);
      toast({
        title: 'Başarılı',
        description: 'Bildiri başarıyla eklendi.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Bildiri ekleme hatası:', error);
      toast({
        title: 'Hata',
        description: 'Bildiri eklenirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddAward = async (awardData) => {
    try {
      const formData = new FormData();
      Object.entries(awardData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      if (selectedFile) {
        formData.append('proofFile', selectedFile);
      }

      const response = await axios.post('/api/academic-activities/awards', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setAwards([...awards, response.data.award]);
      setSelectedFile(null);
      toast({
        title: 'Başarılı',
        description: 'Ödül başarıyla eklendi.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Ödül ekleme hatası:', error);
      toast({
        title: 'Hata',
        description: 'Ödül eklenirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const renderAcademicActivities = () => {
    return (
      <VStack spacing={6} align="stretch">
        <Tabs variant="enclosed" colorScheme="blue" onChange={setSelectedTab} index={selectedTab}>
          <TabList>
            <Tab>Projeler</Tab>
            <Tab>Kitaplar</Tab>
            <Tab>Atıflar</Tab>
            <Tab>Bildiriler</Tab>
            <Tab>Ödüller</Tab>
          </TabList>

          <TabPanels>
            {/* Projects Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Proje Türü</FormLabel>
                  <Select placeholder="Proje türü seçiniz">
                    {PROJECT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Rol</FormLabel>
                  <Select placeholder="Rolünüzü seçiniz">
                    {PROJECT_ROLES.map(role => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Bütçe (TL)</FormLabel>
                  <NumberInput min={0}>
                    <NumberInputField placeholder="Proje bütçesini giriniz" />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Süre (Ay)</FormLabel>
                  <NumberInput min={1}>
                    <NumberInputField placeholder="Proje süresini giriniz" />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Kanıt Belgesi</FormLabel>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                </FormControl>

                <Button
                  colorScheme="green"
                  leftIcon={<AddIcon />}
                  onClick={handleAddProject}
                >
                  Proje Ekle
                </Button>
              </VStack>
            </TabPanel>

            {/* Books Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Tür</FormLabel>
                  <Select placeholder="Kitap türü seçiniz">
                    {BOOK_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Yayınevi</FormLabel>
                  <Input placeholder="Yayınevi adını giriniz" />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>ISBN</FormLabel>
                  <Input placeholder="ISBN numarasını giriniz" />
                </FormControl>

                <FormControl>
                  <FormLabel>Bölüm Bilgisi</FormLabel>
                  <Input placeholder="Bölüm bilgisini giriniz" />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Kanıt Belgesi</FormLabel>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                </FormControl>

                <Button
                  colorScheme="green"
                  leftIcon={<AddIcon />}
                  onClick={handleAddBook}
                >
                  Kitap Ekle
                </Button>
              </VStack>
            </TabPanel>

            {/* Citations Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Atıf Yapan Eser</FormLabel>
                  <Input placeholder="Atıf yapan eserin adını giriniz" />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Yıl</FormLabel>
                  <NumberInput min={1900} max={new Date().getFullYear()}>
                    <NumberInputField placeholder="Atıf yılını giriniz" />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>İndeks</FormLabel>
                  <Select placeholder="İndeks seçiniz">
                    {CITATION_INDEXES.map(index => (
                      <option key={index} value={index}>{index}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Ekran Görüntüsü</FormLabel>
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                </FormControl>

                <Button
                  colorScheme="green"
                  leftIcon={<AddIcon />}
                  onClick={handleAddCitation}
                >
                  Atıf Ekle
                </Button>
              </VStack>
            </TabPanel>

            {/* Presentations Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Konferans Adı</FormLabel>
                  <Input placeholder="Konferans adını giriniz" />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Sunum Türü</FormLabel>
                  <Select placeholder="Sunum türü seçiniz">
                    {PRESENTATION_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <Checkbox>Uluslararası mı?</Checkbox>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Katılım Belgesi</FormLabel>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                </FormControl>

                <Button
                  colorScheme="green"
                  leftIcon={<AddIcon />}
                  onClick={handleAddPresentation}
                >
                  Bildiri Ekle
                </Button>
              </VStack>
            </TabPanel>

            {/* Awards Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Ödül Adı</FormLabel>
                  <Input placeholder="Ödül adını giriniz" />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Kurum</FormLabel>
                  <Input placeholder="Ödülü veren kurumu giriniz" />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Yıl</FormLabel>
                  <NumberInput min={1900} max={new Date().getFullYear()}>
                    <NumberInputField placeholder="Ödül yılını giriniz" />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Ödül Belgesi</FormLabel>
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                </FormControl>

                <Button
                  colorScheme="green"
                  leftIcon={<AddIcon />}
                  onClick={handleAddAward}
                >
                  Ödül Ekle
                </Button>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Display added items */}
        <Box mt={6}>
          <SimpleGrid columns={2} spacing={4}>
            <Stat>
              <StatLabel>Projeler</StatLabel>
              <StatNumber>{projects.length}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Kitaplar</StatLabel>
              <StatNumber>{books.length}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Atıflar</StatLabel>
              <StatNumber>{citations.length}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Bildiriler</StatLabel>
              <StatNumber>{presentations.length}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Ödüller</StatLabel>
              <StatNumber>{awards.length}</StatNumber>
            </Stat>
          </SimpleGrid>
        </Box>
      </VStack>
    );
  };

  const renderPublicationForm = () => {
    return (
      <Grid templateColumns="repeat(2, 1fr)" gap={4}>
        <GridItem colSpan={2}>
          <FormControl isRequired>
            <FormLabel>Yayın Kategorisi</FormLabel>
            <Select
              placeholder="Kategori seçiniz"
              value={newPublication.category}
              onChange={(e) => handlePublicationInputChange('category', e.target.value)}
              size="sm"
            >
              {categories.map(kat => (
                <option key={kat} value={kat}>{kat} - {categoryDescriptions[kat]}</option>
              ))}
            </Select>
          </FormControl>
        </GridItem>

        <GridItem colSpan={2}>
          <FormControl>
            <FormLabel>İndeks</FormLabel>
            <Input 
              value={newPublication.category ? categoryIndexMap[newPublication.category] || '' : ''}
              isReadOnly
              bg="gray.100"
              size="sm"
            />
            <FormHelperText>Kategori seçimine göre otomatik belirlenir</FormHelperText>
          </FormControl>
        </GridItem>

        <GridItem colSpan={{ base: 2, md: 1 }}>
          <FormControl isRequired>
            <FormLabel>Yayın Başlığı</FormLabel>
            <Input
              placeholder="Yayın başlığını giriniz"
              value={newPublication.title}
              onChange={(e) => handlePublicationInputChange('title', e.target.value)}
              size="sm"
            />
          </FormControl>
        </GridItem>

        <GridItem colSpan={{ base: 2, md: 1 }}>
          <FormControl isRequired>
            <FormLabel>DOI</FormLabel>
            <Input
              placeholder="DOI numarasını giriniz"
              value={newPublication.doi}
              onChange={(e) => handlePublicationInputChange('doi', e.target.value)}
              size="sm"
            />
          </FormControl>
        </GridItem>

        <GridItem colSpan={{ base: 2, md: 1 }}>
          <FormControl isRequired>
            <FormLabel>Yayın Yılı</FormLabel>
            <Select
              placeholder="Yıl seçiniz"
              value={newPublication.publicationYear}
              onChange={(e) => handlePublicationInputChange('publicationYear', e.target.value)}
              size="sm"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Select>
          </FormControl>
        </GridItem>

        <GridItem colSpan={{ base: 2, md: 1 }}>
          <FormControl>
            <Flex h="100%" alignItems="center">
              <Checkbox
                isChecked={newPublication.isMainAuthor}
                onChange={(e) => handlePublicationInputChange('isMainAuthor', e.target.checked)}
                mt={6}
              >
                Ana Yazar (Ekstra 10 puan)
              </Checkbox>
            </Flex>
          </FormControl>
        </GridItem>

        <GridItem colSpan={{ base: 2, md: 1 }}>
          <FormControl isRequired>
            <FormLabel>Tam Metin PDF</FormLabel>
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              size="sm"
              py={1}
            />
          </FormControl>
        </GridItem>

        <GridItem colSpan={{ base: 2, md: 1 }}>
          <Flex h="100%" alignItems="center" justifyContent="flex-end">
            <Button
              bg={theme.primary}
              color="white"
              leftIcon={<AddIcon />}
              onClick={handleAddPublication}
              isDisabled={!newPublication.category || !newPublication.doi || 
                         !newPublication.title || !newPublication.publicationYear || !selectedFile}
              size="md"
              _hover={{
                bg: theme.info,
              }}
            >
              Yayın Ekle
            </Button>
          </Flex>
        </GridItem>
      </Grid>
    );
  };

  // Update the render function for step 1 to show minimum language score
  const renderLanguageStep = () => {
    const minScore = criteria ? criteria.minLanguageScore : 65;
    
    return (
      <VStack spacing={6} align="stretch">
        <FormControl isRequired>
          <FormLabel fontWeight="bold">Ad Soyad</FormLabel>
          <Input
            placeholder="Ad Soyad giriniz"
            value={formData.adSoyad}
            onChange={(e) => handleInputChange('adSoyad', e.target.value)}
            size="lg"
            bg="white"
            borderColor="gray.300"
            _hover={{ borderColor: "gray.400" }}
            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel fontWeight="bold">Yabancı Dil Sınavı</FormLabel>
          <Select
            placeholder="Sınav türünü seçiniz"
            value={formData.dilSinavi}
            onChange={(e) => handleInputChange('dilSinavi', e.target.value)}
            size="lg"
            bg="white"
            borderColor="gray.300"
            _hover={{ borderColor: "gray.400" }}
            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
          >
            {acceptedLanguageExams.map((sinav) => (
              <option key={sinav} value={sinav}>{sinav}</option>
            ))}
          </Select>
        </FormControl>

        <FormControl 
          isRequired 
          isInvalid={formData.dilPuani !== '' && Number(formData.dilPuani) < minScore}
        >
          <FormLabel fontWeight="bold">Puan</FormLabel>
          <NumberInput
            min={0}
            max={100}
            value={formData.dilPuani}
            onChange={(value) => handleInputChange('dilPuani', value)}
            size="lg"
          >
            <NumberInputField 
              placeholder="Dil sınavı puanınızı giriniz"
              bg="white"
              borderColor="gray.300"
              _hover={{ borderColor: "gray.400" }}
              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
            />
          </NumberInput>
        </FormControl>

        {formData.dilPuani !== '' && Number(formData.dilPuani) < minScore && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Text>
              Başvuru yapabilmek için dil puanınız en az {minScore} olmalıdır.
            </Text>
          </Alert>
        )}
      </VStack>
    );
  };

  // Function to generate the filled PDF
  const generateFilledPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      
      const pdfData = {
        academic_post: ilanID,
        fieldGroup,
        personalInfo: {
          fullName: formData.adSoyad,
          languageExam: formData.dilSinavi,
          languageScore: formData.dilPuani
        },
        publications,
        stats: getPublicationStats(),
        criteria,
        totalPoints
      };
      
      const response = await axios.post('/api/generate-pdf/atama-yonergesi', pdfData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        responseType: 'blob'
      });
      
      // Create blob URL for the PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setPdfUrl(url);
      setIsPdfModalOpen(true);
      
      toast({
        title: 'PDF Hazır',
        description: 'Form bilgilerinizle doldurulmuş PDF hazırlandı.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      toast({
        title: 'Hata',
        description: 'PDF oluşturulurken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Function to download the generated PDF
  const downloadPdf = () => {
    if (pdfUrl) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = 'atama-yonergesi-24-34.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Update the renderPublicationsStep function to include the PDF button
  const renderPublicationsStep = () => {
    if (!criteria) {
      if (isLoading) {
        return (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" />
            <Text mt={4}>Kriter bilgileri yükleniyor...</Text>
          </Box>
        );
      } else {
        return (
          <Box textAlign="center" py={10}>
            <Alert status="error">
              <AlertIcon />
              <Box>
                <AlertTitle>Kriter Bilgileri Alınamadı</AlertTitle>
                <AlertDescription>
                  Temel alanınız için kriter bilgilerini alırken bir hata oluştu. Lütfen sayfayı yenileyin veya farklı bir temel alan seçin.
                </AlertDescription>
              </Box>
            </Alert>
          </Box>
        );
      }
    }
    
    const stats = getPublicationStats();
    const { publicationCriteria, pointCriteria } = criteria;
    
    return (
      <Grid templateColumns="repeat(12, 1fr)" gap={4}>
        {/* Yayın İstatistikleri ve Kriterler */}
        <GridItem colSpan={{ base: 12, lg: 4 }} order={{ base: 2, lg: 1 }}>
          <Box borderWidth="1px" borderRadius="lg" p={3} bg={`${theme.light}`} h="100%">
            <Heading size="sm" mb={3} color={theme.primary}>Yayın İstatistikleri ve Kriterler</Heading>
            <SimpleGrid columns={{ base: 2, md: 3, lg: 1 }} spacing={3}>
              <Stat size="sm">
                <StatLabel fontSize="xs">Toplam Yayın</StatLabel>
                <StatNumber fontSize="md" color={stats.totalCount >= publicationCriteria.minTotalPublications ? theme.success : theme.danger}>
                  {stats.totalCount} / {publicationCriteria.minTotalPublications}
                </StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="xs">A1-A2 Yayınlar</StatLabel>
                <StatNumber fontSize="md" color={stats.a1a2Count >= publicationCriteria.minA1A2Publications ? theme.success : theme.danger}>
                  {stats.a1a2Count} / {publicationCriteria.minA1A2Publications}
                </StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="xs">A1-A4 Yayınlar (Min: {publicationCriteria.minA1A4Points})</StatLabel>
                <StatNumber fontSize="md" color={stats.a1a4Count >= publicationCriteria.minA1A4Publications && stats.a1a4Points >= publicationCriteria.minA1A4Points ? theme.success : theme.danger}>
                  {stats.a1a4Count} / {publicationCriteria.minA1A4Publications}
                </StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="xs">A1-A5 Yayınlar (Min: {publicationCriteria.minA1A5Points})</StatLabel>
                <StatNumber fontSize="md" color={stats.a1a5Count >= publicationCriteria.minA1A5Publications && stats.a1a5Points >= publicationCriteria.minA1A5Points ? theme.success : theme.danger}>
                  {stats.a1a5Count} / {publicationCriteria.minA1A5Publications}
                </StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="xs">Ana Yazar</StatLabel>
                <StatNumber fontSize="md" color={stats.mainAuthorCount >= publicationCriteria.minMainAuthorPublications ? theme.success : theme.danger}>
                  {stats.mainAuthorCount} / {publicationCriteria.minMainAuthorPublications}
                </StatNumber>
              </Stat>
              <Stat size="sm">
                <StatLabel fontSize="xs">Minimum Puan</StatLabel>
                <StatNumber fontSize="md" color={totalPoints >= pointCriteria.minPoints ? theme.success : theme.danger}>
                  {totalPoints} / {pointCriteria.minPoints}
                </StatNumber>
              </Stat>
            </SimpleGrid>

            {!isValidStep() && (
              <Alert status="warning" mt={3} p={2} borderRadius="md" fontSize="sm">
                <AlertIcon boxSize="1rem" color={theme.warning} />
                <Box fontSize="xs">
                  <AlertTitle mb={1}>Zorunlu Kriterler</AlertTitle>
                  <UnorderedList spacing={1} pl={2} fontSize="2xs">
                    <ListItem>En az {publicationCriteria.minTotalPublications} yayın</ListItem>
                    <ListItem>En az {publicationCriteria.minA1A2Publications} adet A1-A2 kategorisinde yayın</ListItem>
                    <ListItem>En az {publicationCriteria.minA1A4Publications} adet A1-A4 kategorisinde yayın</ListItem>
                    <ListItem>En az {publicationCriteria.minA1A5Publications} adet A1-A5 kategorisinde yayın</ListItem>
                    <ListItem>En az {publicationCriteria.minMainAuthorPublications} yayında ana yazar olunmalı</ListItem>
                    <ListItem>A1-A4 kategorisindeki yayınların toplam puanı en az {publicationCriteria.minA1A4Points} olmalı</ListItem>
                    <ListItem>A1-A5 kategorisindeki yayınların toplam puanı en az {publicationCriteria.minA1A5Points} olmalı</ListItem>
                    <ListItem>Toplam puan: minimum {pointCriteria.minPoints} olmalı</ListItem>
                  </UnorderedList>
                </Box>
              </Alert>
            )}
            
            {/* Add PDF Form Button */}
            <Button
              mt={4}
              leftIcon={<ViewIcon />}
              onClick={generateFilledPdf}
              isLoading={isGeneratingPdf}
              loadingText="PDF Hazırlanıyor"
              colorScheme="teal"
              size="sm"
              width="full"
            >
              Atama Formu Önizleme
            </Button>
          </Box>
        </GridItem>

        {/* Sağ taraf - Yayın listesi ve form */}
        <GridItem colSpan={{ base: 12, lg: 8 }} order={{ base: 1, lg: 2 }}>
          <VStack spacing={4} align="stretch">
            {/* Yeni Yayın Ekleme Formu */}
            <Box borderWidth="1px" borderRadius="lg" p={3}>
              <Heading size="sm" mb={3}>Yeni Yayın Ekle</Heading>
              {renderPublicationForm()}
            </Box>

            {/* Mevcut Yayınlar Listesi */}
            {publications.length > 0 && (
              <Box borderWidth="1px" borderRadius="lg" p={3} maxH="300px" overflowY="auto">
                <Heading size="sm" mb={3}>Eklenen Yayınlar ({publications.length})</Heading>
                <Stack spacing={2} align="stretch">
                  {publications.map((publication, index) => (
                    <Box 
                      key={publication._id || index} 
                      p={2} 
                      borderWidth="1px" 
                      borderRadius="md"
                      bg="white"
                    >
                      <Flex justify="space-between" align="top">
                        <Box>
                          <Text fontWeight="bold" fontSize="sm" noOfLines={1}>{publication.title}</Text>
                          <HStack spacing={2} mt={1}>
                            <Badge colorScheme="blue" fontSize="xs">{publication.category}</Badge>
                            <Badge colorScheme="purple" fontSize="xs">{publication.index}</Badge>
                            <Badge colorScheme={publication.isMainAuthor ? "green" : "gray"} fontSize="xs">
                              {publication.isMainAuthor ? "Ana Yazar" : "Ortak Yazar"}
                            </Badge>
                          </HStack>
                          <Text fontSize="xs" mt={1} color="gray.600">DOI: {publication.doi} • Yıl: {publication.publicationYear}</Text>
                        </Box>
                        <IconButton
                          icon={<DeleteIcon />}
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => handleDeletePublication(index)}
                          size="sm"
                          aria-label="Yayını sil"
                        />
                      </Flex>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </VStack>
        </GridItem>
      </Grid>
    );
  };

  // Update the renderStep function
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <VStack spacing={6} align="stretch">
            <FormControl isRequired>
              <FormLabel fontWeight="bold">Temel Alan</FormLabel>
              <Select
                placeholder="Temel alanınızı seçiniz"
                value={fieldGroup}
                onChange={handleFieldGroupChange}
                size="lg"
                bg="white"
                borderColor="gray.300"
                _hover={{ borderColor: "gray.400" }}
                _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px blue.500" }}
              >
                {Object.entries(fieldGroups).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </Select>
            </FormControl>

            {fieldGroup && (
              <Alert status="info" borderRadius="md" bg="blue.50">
                <AlertIcon />
                <Text>
                  Seçtiğiniz alan için gerekli belgeler ve kriterler bir sonraki adımda gösterilecektir.
                </Text>
              </Alert>
            )}
          </VStack>
        );

      case 1:
        return renderLanguageStep();

      case 2:
        return renderPublicationsStep();

      case 3:
        return renderAcademicActivities();

      default:
        return null;
    }
  };

  return (
    <Box position="relative" minH="calc(100vh - 100px)" bg="gray.50">
      {/* İlan Başlığı */}
      <Box 
        width="100%" 
        textAlign="center" 
        py={3} 
        borderBottom="1px" 
        borderColor="gray.200"
        bg="white"
        position="sticky"
        top={0}
        zIndex={10}
        boxShadow="sm"
      >
        <Heading size="md" color={theme.primary}>
          {ilanBasligi}
        </Heading>
      </Box>

      <Container maxW="container.xl" py={4}>
        <Card 
          borderRadius="lg" 
          boxShadow="md"
          bg="white"
          overflow="hidden"
        >
          <CardHeader bg={`${theme.light}`} py={3}>
            <Progress 
              value={(currentStep + 1) * 25} 
              size="sm" 
              colorScheme="blue"
              borderRadius="full"
              bg={theme.light}
              sx={{
                '& > div': {
                  background: theme.primary
                }
              }}
            />
            
            <Flex mt={4} justify="space-between" align="center">
              <Box>
                <Heading size="sm" color={theme.primary}>
                  Adım {currentStep + 1}/4: {currentStep === 0 ? 'Temel Alan Seçimi' : currentStep === 1 ? 'Kişisel Bilgiler' : currentStep === 2 ? 'Yayın İstatistikleri' : 'Akademik Faaliyetler'}
                </Heading>
                <Text color={theme.primary} fontSize="xs" mt={1}>
                  {currentStep === 0 
                    ? 'Başvurunuzu doğru şekilde değerlendirebilmemiz için lütfen temel alanınızı seçiniz.'
                    : currentStep === 1 
                      ? 'Lütfen kişisel bilgilerinizi ve dil sınavı bilgilerinizi giriniz.'
                      : currentStep === 2 
                        ? 'Lütfen yayın istatistiklerini ve yeni yayın ekleme işlemlerini tamamlayınız.'
                        : 'Lütfen akademik faaliyetlerinizi ve ekstra bilgilerinizi giriniz.'}
                </Text>
              </Box>
              <HStack>
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    colorScheme="blue"
                    size="sm"
                    onClick={handlePreviousStep}
                    leftIcon={<ChevronLeftIcon />}
                    borderColor={theme.primary}
                    color={theme.primary}
                    _hover={{
                      bg: theme.light,
                    }}
                  >
                    Geri
                  </Button>
                )}
                <Button
                  bg={theme.primary}
                  color="white"
                  size="sm"
                  onClick={handleNextStep}
                  isDisabled={!isValidStep()}
                  rightIcon={currentStep < 3 ? <ChevronRightIcon /> : undefined}
                  _hover={{
                    bg: theme.info,
                  }}
                >
                  {currentStep === 3 ? 'Başvuruyu Tamamla' : 'Devam Et'}
                </Button>
              </HStack>
            </Flex>
          </CardHeader>

          <CardBody p={4}>
            {renderStep()}
          </CardBody>
        </Card>
      </Container>

      {/* İlanlara Geri Dön Butonu - Sağ Alt Köşede Sabit */}
      <Box
        position="fixed"
        bottom={4}
        right={4}
        zIndex={20}
      >
        <Button
          leftIcon={<ChevronLeftIcon />}
          onClick={() => navigate('/aday-ekrani')}
          bg={theme.secondary}
          color="white"
          size="md"
          boxShadow="md"
          _hover={{
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
            bg: theme.danger,
          }}
          transition="all 0.2s"
        >
          İlanlara Geri Dön
        </Button>
      </Box>

      {/* PDF Preview Modal */}
      <Modal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} size="4xl" isCentered>
        <ModalOverlay />
        <ModalContent h="90vh">
          <ModalHeader>
            Atama Yönergesi 24-34 Formu
            <Text fontSize="sm" fontWeight="normal" mt={1} color="gray.600">
              Bilgilerinize göre doldurulmuş form önizlemesi
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p={0} overflowY="auto">
            {pdfUrl ? (
              <iframe 
                src={pdfUrl} 
                width="100%" 
                height="100%" 
                title="Atama Yönergesi PDF"
                style={{ border: 'none' }}
              />
            ) : (
              <Center h="100%">
                <Spinner size="xl" />
              </Center>
            )}
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={() => setIsPdfModalOpen(false)}>
              Kapat
            </Button>
            <Button 
              leftIcon={<DownloadIcon />} 
              colorScheme="blue"
              onClick={downloadPdf}
            >
              PDF İndir
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DrOgrUyesiBasvuruForm;
