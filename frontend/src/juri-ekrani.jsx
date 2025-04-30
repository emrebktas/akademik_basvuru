import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  CardHeader,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Textarea,
  FormControl,
  FormLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  Stack,
  useToast,
  Input,
  Progress,
  Link,
  Tooltip,
  Spinner,
  Tag,
  TagLabel,
  Image,
  AspectRatio,
  SimpleGrid,
  Center,
  Icon,
} from '@chakra-ui/react';
import {
  CheckIcon,
  CloseIcon,
  DownloadIcon,
  ViewIcon,
  AttachmentIcon,
  InfoIcon,
} from '@chakra-ui/icons';
import {
  FaFileAlt,
  FaCheck,
  FaTimes,
  FaClock,
  FaEye,
  FaPaperPlane,
  FaGraduationCap,
  FaUniversity,
  FaUserGraduate,
  FaCalendarAlt,
  FaClipboardList,
  FaSearch,
  FaUpload,
  FaClipboardCheck,
  FaAngleRight,
  FaFile,
  FaComments,
  FaCheckCircle,
  FaSignOutAlt,
} from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Theme colors from main page
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

const JuriEkrani = () => {
  // State definitions
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [evaluation, setEvaluation] = useState({
    report: null,
    comments: '',
    decision: '',
    reportUploading: false,
  });
  const [completedEvaluations, setCompletedEvaluations] = useState(0);
  const [pendingEvaluations, setPendingEvaluations] = useState(0);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  // Disclosures for modals
  const { 
    isOpen: isDetailOpen, 
    onOpen: onDetailOpen, 
    onClose: onDetailClose 
  } = useDisclosure();
  const { 
    isOpen: isDocViewerOpen, 
    onOpen: onDocViewerOpen, 
    onClose: onDocViewerClose 
  } = useDisclosure();
  const [selectedDocument, setSelectedDocument] = useState(null);
  
  const toast = useToast();
  const navigate = useNavigate();

  // Fetch evaluation statistics
  const fetchEvaluationStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/juri/evaluation-stats`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      setCompletedEvaluations(response.data.completed);
      setPendingEvaluations(response.data.pending);
    } catch (error) {
      console.error('Error fetching evaluation stats:', error);
      toast({
        title: 'Hata',
        description: 'Değerlendirme istatistikleri alınırken bir hata oluştu.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setStatsLoading(false);
    }
  }, [toast]);

  // Fetch assigned applications for the jury member
  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/juri/assigned-applications`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      setApplications(response.data);
      
      // Fetch evaluation stats separately
      await fetchEvaluationStats();
    } catch (error) {
      console.error('Error fetching assigned applications:', error);
      toast({
        title: 'Hata',
        description: 'Başvurular yüklenirken bir hata oluştu.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchEvaluationStats]);

  // Fetch application details and documents
  const fetchApplicationDetails = async (applicationId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/juri/application/${applicationId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      setSelectedApplication(response.data.application);
      
      // Make sure documents are properly set
      if (response.data.documents && Array.isArray(response.data.documents)) {
        setDocuments(response.data.documents);
        console.log("Fetched documents:", response.data.documents);
      } else {
        setDocuments([]);
        console.log("No documents found or invalid format");
      }
      
      // Get publications for this application
      if (response.data.publications) {
        setPublications(response.data.publications);
      } else {
        setPublications([]);
      }
      
      // Get current jury member's evaluation if exists
      const juryMember = response.data.application.jury_members.find(
        member => member.user_id === localStorage.getItem('userId')
      );
      
      if (juryMember && juryMember.evaluation) {
        setEvaluation({
          report: juryMember.evaluation.report_url ? { name: 'Mevcut Rapor' } : null,
          comments: juryMember.evaluation.comments || '',
          decision: juryMember.evaluation.decision || '',
          reportUploading: false
        });
      } else {
        // Reset evaluation form
        setEvaluation({
          report: null,
          comments: '',
          decision: '',
          reportUploading: false
        });
      }
      
      setLoading(false);
      onDetailOpen();
    } catch (error) {
      console.error('Error fetching application details:', error);
      setLoading(false);
      toast({
        title: 'Hata',
        description: 'Başvuru detayları yüklenirken bir hata oluştu.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Open document viewer for application documents
  const handleViewDocument = async (document) => {
    if (!document || !document._id) {
      toast({
        title: 'Hata',
        description: 'Belge görüntülenemiyor. Geçersiz belge bilgisi.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setPdfLoading(true);
    setPdfUrl(null);
    setSelectedDocument({
      ...document,
      isPublication: false
    });
    onDocViewerOpen();

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/juri/view-document/${document._id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      
      if (response.data && response.data.fileUrl) { 
        setPdfUrl(response.data.fileUrl); 
      } else {
        setPdfUrl(`${import.meta.env.VITE_API_URL}/api/juri/view-document/${document._id}`);
      }
      
    } catch (error) {
      console.error("Error fetching document view URL:", error);
      toast({
        title: 'Hata',
        description: "Belge görüntüleme URL'si alınamadı.",
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      onDocViewerClose();
    } finally {
        setPdfLoading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setEvaluation({ ...evaluation, report: file });
    }
  };

  // Submit evaluation
  const handleSubmitEvaluation = async () => {
    // Validate form
    if (!evaluation.decision) {
      toast({
        title: 'Uyarı',
        description: 'Lütfen olumlu/olumsuz kararınızı belirtiniz.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setEvaluation({ ...evaluation, reportUploading: true });
      
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('applicationId', selectedApplication._id);
      formData.append('decision', evaluation.decision);
      formData.append('comments', evaluation.comments);
      
      if (evaluation.report && !(evaluation.report.name === 'Mevcut Rapor')) {
        formData.append('report', evaluation.report);
      }
      
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/juri/submit-evaluation`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      toast({
        title: 'Başarılı',
        description: 'Değerlendirmeniz başarıyla kaydedildi.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Refresh evaluation stats
      await fetchEvaluationStats();
      
      // Refresh applications list
      fetchApplications();
      onDetailClose();
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast({
        title: 'Hata',
        description: 'Değerlendirme kaydedilirken bir hata oluştu.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setEvaluation({ ...evaluation, reportUploading: false });
    }
  };

  // Check if evaluation is completed
  const isEvaluationCompleted = (application) => {
    if (!application || !application.jury_members) return false;
    
    const userId = localStorage.getItem('userId');
    const juryMember = application.jury_members.find(
      member => member.user_id === userId || member.user_id.toString() === userId
    );
    
    return juryMember && juryMember.evaluation_status === 'Tamamlandı';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Belirtilmemiş';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  // View publication PDF - Fetch signed URL
  const handleViewPublication = async (publication) => {
    if (!publication || !publication._id) {
      toast({ title: 'Hata', description: 'Geçersiz yayın bilgisi.', status: 'error' });
      return;
    }
    if (!publication.pdfFile && publication.doi) {
      window.open(`https://doi.org/${publication.doi}`, '_blank');
      return;
    }
    if (!publication.pdfFile) {
      toast({ title: 'Bilgi', description: 'Görüntülenebilir dosya veya DOI yok.', status: 'info' });
      return;
    }

    setPdfLoading(true);
    setPdfUrl(null);
    setSelectedDocument({
      _id: publication._id,
      dosya_adi: publication.title,
      belge_tipi: `Akademik Yayın (${publication.category})`,
      isPublication: true
    });
    onDocViewerOpen();

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/juri/view-publication/${publication._id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      if (response.data && response.data.pdfUrl) {
        setPdfUrl(response.data.pdfUrl);
        console.log("Fetched Signed URL:", response.data.pdfUrl);
      } else {
        throw new Error("PDF URL not found in response");
      }
    } catch (error) {
      console.error("Error fetching signed URL:", error);
      toast({
        title: 'Hata',
        description: error.response?.data?.error || "PDF görüntüleme URL'si alınamadı.",
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      onDocViewerClose();
    } finally {
      setPdfLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/');
    toast({
      title: 'Çıkış Yapıldı',
      description: 'Başarıyla çıkış yaptınız.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Load applications on component mount
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return (
    <Box minH="100vh" bg={theme.light}>
      {/* Hero Section */}
      <Box bg={theme.primary} color="white" py={8} mb={8} boxShadow="lg" position="relative" overflow="hidden">
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
            <Box textAlign="center" flexGrow={1}>
              <Heading size="xl" mb={4}>Jüri Değerlendirme Paneli</Heading>
              <Divider my={4} borderColor={theme.tertiary} width="60%" mx="auto" opacity="0.5" />
              <Text fontSize="lg">Akademik başvuruları değerlendirme ve raporlama sistemi</Text>
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

      <Container maxW="container.xl" py={8}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={8}>
          <Card bg="white" boxShadow="md" borderRadius="lg">
            <CardBody>
              <Stat>
                <Flex align="center" mb={4}>
                  <Flex 
                    bg={`${theme.success}20`} 
                    p={2} 
                    borderRadius="full" 
                    color={theme.success}
                    mr={3}
                    boxSize="40px"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon as={FaCheckCircle} boxSize="20px" />
                  </Flex>
                  <StatLabel fontSize="lg">Tamamlanan Değerlendirmeler</StatLabel>
                </Flex>
                <StatNumber fontSize="3xl" color={theme.success}>
                  {statsLoading ? <Spinner size="sm" /> : completedEvaluations}
                </StatNumber>
                <StatHelpText>
                  <HStack>
                    <Icon as={FaCheck} color={theme.success} />
                    <Text>Değerlendirmeleri tamamlandı</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="white" boxShadow="md" borderRadius="lg">
            <CardBody>
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
                  <StatLabel fontSize="lg">Bekleyen Değerlendirmeler</StatLabel>
                </Flex>
                <StatNumber fontSize="3xl" color={theme.warning}>
                  {statsLoading ? <Spinner size="sm" /> : pendingEvaluations}
                </StatNumber>
                <StatHelpText>Değerlendirme bekliyor</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="white" boxShadow="md" borderRadius="lg">
            <CardBody>
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
                    <Icon as={FaClipboardList} boxSize="20px" />
                  </Flex>
                  <StatLabel fontSize="lg">Toplam Görevlendirme</StatLabel>
                </Flex>
                <StatNumber fontSize="3xl" color={theme.primary}>
                  {statsLoading ? <Spinner size="sm" /> : (completedEvaluations + pendingEvaluations)}
                </StatNumber>
                <StatHelpText>Atanan başvurular</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

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
              <Heading size="lg" color={theme.primary}>Değerlendirme Bekleyen Başvurular</Heading>
            </Flex>
          </CardHeader>
          <CardBody p={6}>
            {loading ? (
              <Center p={8}>
                <Spinner size="xl" color={theme.primary} />
              </Center>
            ) : applications.length === 0 ? (
              <Text>Atanmış başvuru bulunmamaktadır.</Text>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>İlan Başlığı</Th>
                    <Th>Aday</Th>
                    <Th>Kademe</Th>
                    <Th>Başvuru Tarihi</Th>
                    <Th>Durum</Th>
                    <Th>Değerlendirme</Th>
                    <Th>İşlemler</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {applications.map((application) => (
                    <Tr key={application._id}>
                      <Td>{application.ilan_id?.ilan_basligi || 'Belirtilmemiş'}</Td>
                      <Td>{application.aday_id ? `${application.aday_id.ad} ${application.aday_id.soyad}` : 'Belirtilmemiş'}</Td>
                      <Td>
                        <Badge bg={theme.primary} color="white" borderRadius="md" px={2} py={1}>
                          <HStack spacing={1}>
                            <Icon as={FaGraduationCap} />
                            <Text>{application.ilan_id?.kademe || 'Belirtilmemiş'}</Text>
                          </HStack>
                        </Badge>
                      </Td>
                      <Td>{formatDate(application.created_at)}</Td>
                      <Td>
                        <Badge 
                          colorScheme={
                            application.durum_gecmisi[0].durum === 'Tamamlandı' ? 'green' :
                            application.durum_gecmisi[0].durum === 'Beklemede' ? 'yellow' :
                            'blue'
                          }
                          borderRadius="md"
                          px={2}
                          py={1}
                        >
                          {application.durum_gecmisi[0].durum}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge 
                          colorScheme={isEvaluationCompleted(application) ? 'green' : 'yellow'}
                          borderRadius="md"
                          px={2}
                          py={1}
                        >
                          {isEvaluationCompleted(application) ? 'Tamamlandı' : 'Beklemede'}
                        </Badge>
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          bg={theme.primary}
                          color="white"
                          leftIcon={<FaEye />}
                          onClick={() => fetchApplicationDetails(application._id)}
                          _hover={{ bg: theme.info }}
                          boxShadow="sm"
                        >
                          İncele
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </Container>

      {/* Application Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay bg={`${theme.primary}40`} backdropFilter="blur(2px)" />
        <ModalContent borderRadius="lg" boxShadow="xl">
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
                <Icon as={FaClipboardCheck} boxSize="20px" />
              </Flex>
              <Text color={theme.primary}>Başvuru Değerlendirme</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedApplication && (
              <Tabs isFitted variant="enclosed" colorScheme="blue">
                <TabList mb="1em">
                  <Tab _selected={{ color: 'white', bg: theme.primary }}>
                    <HStack>
                      <Icon as={FaUserGraduate} />
                      <Text>Aday Bilgileri</Text>
                    </HStack>
                  </Tab>
                  <Tab _selected={{ color: 'white', bg: theme.primary }}>
                    <HStack>
                      <Icon as={FaFileAlt} />
                      <Text>Başvuru Belgeleri</Text>
                    </HStack>
                  </Tab>
                  <Tab _selected={{ color: 'white', bg: theme.primary }}>
                    <HStack>
                      <Icon as={FaClipboardCheck} />
                      <Text>Değerlendirme</Text>
                    </HStack>
                  </Tab>
                </TabList>
                <TabPanels>
                  {/* Aday Bilgileri */}
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <Box>
                        <Heading size="md" mb={2}>İlan Bilgileri</Heading>
                        <Text fontWeight="bold">{selectedApplication.ilan_id?.ilan_basligi}</Text>
                        <Text>Kademe: {selectedApplication.ilan_id?.kademe}</Text>
                        <Text>Bölüm: {selectedApplication.ilan_id?.department}</Text>
                        <Text>
                          Başvuru Tarihleri: {formatDate(selectedApplication.ilan_id?.basvuru_baslangic_tarihi)} - {formatDate(selectedApplication.ilan_id?.basvuru_bitis_tarihi)}
                        </Text>
                      </Box>
                      
                      <Divider />
                      
                      <Box>
                        <Heading size="md" mb={2}>Aday Bilgileri</Heading>
                        <Text fontWeight="bold">
                          {selectedApplication.aday_id?.ad} {selectedApplication.aday_id?.soyad}
                        </Text>
                        <Text>TC Kimlik No: {selectedApplication.aday_id?.tc_kimlik_no || 'Belirtilmemiş'}</Text>
                        <Text>E-posta: {selectedApplication.aday_id?.email || 'Belirtilmemiş'}</Text>
                        <Text>
                          Başvuru Tarihi: {formatDate(selectedApplication.created_at)}
                        </Text>
                      </Box>
                    </VStack>
                  </TabPanel>
                  
                  {/* Başvuru Belgeleri */}
                  <TabPanel>
                    <Box>
                      <Heading size="md" mb={4}>Başvuru Belgeleri</Heading>
                      {loading ? (
                        <Center p={8}>
                          <Spinner size="xl" />
                        </Center>
                      ) : documents.length === 0 ? (
                        <Text></Text>
                      ) : (
                        <Table variant="simple" mb={8}>
                          <Thead>
                            <Tr>
                              <Th>Belge Tipi</Th>
                              <Th>Dosya Adı</Th>
                              <Th>Yükleme Tarihi</Th>
                              <Th>İşlemler</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {documents.map((doc) => (
                              <Tr key={doc._id}>
                                <Td>{doc.belge_tipi}</Td>
                                <Td>{doc.dosya_adi}</Td>
                                <Td>{formatDate(doc.yuklenme_tarihi)}</Td>
                                <Td>
                                  <HStack spacing={2}>
                                    <Tooltip label="Görüntüle">
                                      <IconButton
                                        icon={<ViewIcon />}
                                        aria-label="Görüntüle"
                                        size="sm"
                                        colorScheme="blue"
                                        onClick={() => handleViewDocument(doc)}
                                      />
                                    </Tooltip>
                                    <Tooltip label="İndir">
                                      <IconButton
                                        icon={<DownloadIcon />}
                                        aria-label="İndir"
                                        size="sm"
                                        colorScheme="green"
                                        as="a"
                                        href={`${import.meta.env.VITE_API_URL}/api/juri/download-document/${doc._id}`}
                                        target="_blank"
                                      />
                                    </Tooltip>
                                  </HStack>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      )}
                      
                      {/* Akademik Yayınlar */}
                      <Box mt={6}>
                        <Heading size="md" mb={4}>Akademik Yayınlar</Heading>
                        {publications.length === 0 ? (
                          <Text>Bu başvuruya ait akademik yayın bulunmamaktadır.</Text>
                        ) : (
                          <Table variant="simple">
                            <Thead>
                              <Tr>
                                <Th>Yayın Adı</Th>
                                <Th>Kategori</Th>
                                <Th>İndeks</Th>
                                <Th>Yıl</Th>
                                <Th>DOI</Th>
                                <Th>Puan</Th>
                                <Th>İşlemler</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {publications.map((pub) => (
                                <Tr key={pub._id}>
                                  <Td>{pub.title}</Td>
                                  <Td>
                                    <Badge colorScheme={pub.isMainAuthor ? "green" : "blue"}>
                                      {pub.category}
                                      {pub.isMainAuthor && " (Başlıca Yazar)"}
                                    </Badge>
                                  </Td>
                                  <Td>{pub.index}</Td>
                                  <Td>{pub.publicationYear}</Td>
                                  <Td>
                                    {pub.doi && (
                                      <Link href={`https://doi.org/${pub.doi}`} isExternal color="blue.500">
                                        {pub.doi}
                                      </Link>
                                    )}
                                  </Td>
                                  <Td>{pub.points}</Td>
                                  <Td>
                                    <HStack spacing={2}>
                                      {pub.pdfFile && (
                                        <Tooltip label="PDF Dosyasını Görüntüle">
                                          <IconButton
                                            icon={<ViewIcon />}
                                            aria-label="Görüntüle"
                                            size="sm"
                                            colorScheme="blue"
                                            onClick={() => handleViewPublication(pub)}
                                          />
                                        </Tooltip>
                                      )}
                                    </HStack>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        )}
                      </Box>
                    </Box>
                  </TabPanel>
                  
                  {/* Değerlendirme */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      <Box>
                        <Heading size="md" mb={4}>Jüri Değerlendirme Formu</Heading>
                        <Text mb={4}>
                          Adayın başvurusunu inceledikten sonra aşağıdaki değerlendirme formunu doldurarak 
                          nihai kararınızı belirtiniz. Değerlendirme raporunuzu PDF formatında yükleyiniz.
                        </Text>
                      </Box>
                      
                      <FormControl isRequired>
                        <FormLabel>Rapor Yükleme</FormLabel>
                        {evaluation.report ? (
                          <HStack>
                            <Tag size="lg" colorScheme="green">
                              <TagLabel>{evaluation.report.name}</TagLabel>
                            </Tag>
                            <Button 
                              size="sm" 
                              onClick={() => setEvaluation({ ...evaluation, report: null })}
                            >
                              Değiştir
                            </Button>
                          </HStack>
                        ) : (
                          <Input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                          />
                        )}
                        <FormHelperText>
                          Değerlendirme raporunuzu PDF formatında yükleyiniz.
                        </FormHelperText>
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Nihai Karar</FormLabel>
                        <RadioGroup 
                          value={evaluation.decision} 
                          onChange={(value) => setEvaluation({ ...evaluation, decision: value })}
                        >
                          <Stack direction="row">
                            <Radio value="Olumlu">Olumlu</Radio>
                            <Radio value="Olumsuz">Olumsuz</Radio>
                          </Stack>
                        </RadioGroup>
                        <FormHelperText>
                          Başvuru hakkındaki nihai kararınızı belirtiniz.
                        </FormHelperText>
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Ek Açıklamalar</FormLabel>
                        <Textarea
                          placeholder="Değerlendirmeniz hakkında ek açıklamalar..."
                          value={evaluation.comments}
                          onChange={(e) => setEvaluation({ ...evaluation, comments: e.target.value })}
                          minH="150px"
                        />
                      </FormControl>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}
          </ModalBody>
          <ModalFooter bg={theme.light} borderTop="1px solid" borderColor="gray.200">
            <Button 
              colorScheme="blue" 
              mr={3} 
              onClick={handleSubmitEvaluation}
              isLoading={evaluation.reportUploading}
              loadingText="Kaydediliyor"
              bg={theme.primary}
              _hover={{ bg: theme.info }}
              leftIcon={<FaPaperPlane />}
            >
              Değerlendirmeyi Tamamla
            </Button>
            <Button variant="ghost" onClick={onDetailClose}>
              İptal
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Document Viewer Modal */}
      <Modal isOpen={isDocViewerOpen} onClose={onDocViewerClose} size="5xl">
        <ModalOverlay bg={`${theme.primary}40`} backdropFilter="blur(2px)" />
        <ModalContent borderRadius="lg" boxShadow="xl">
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
                <Icon as={FaFile} boxSize="20px" />
              </Flex>
              <Text color={theme.primary}>
                {selectedDocument?.belge_tipi} - {selectedDocument?.dosya_adi}
              </Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p={0} minH="60vh">
            {pdfLoading ? (
              <Center h="100%" minH="60vh">
                <VStack>
                  <Spinner size="xl" color={theme.primary} />
                  <Text mt={4}>PDF Yükleniyor...</Text>
                </VStack>
              </Center>
            ) : pdfUrl ? (
              <Box borderWidth="1px" borderRadius="lg" overflow="hidden" h="80vh">
                <iframe
                  title={selectedDocument?.dosya_adi || 'Belge'}
                  src={pdfUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 'none' }}
                />
              </Box>
            ) : (
              <Center h="100%" minH="60vh">
                <Text color="red.500">PDF yüklenemedi.</Text>
              </Center>
            )}
          </ModalBody>
          <ModalFooter bg={theme.light} borderTop="1px solid" borderColor="gray.200">
            <Button 
              leftIcon={<DownloadIcon />}
              colorScheme="blue" 
              mr={3}
              as="a"
              href={selectedDocument?.isPublication 
                ? `${import.meta.env.VITE_API_URL}/api/juri/view-publication/${selectedDocument?._id}`
                : `${import.meta.env.VITE_API_URL}/api/juri/download-document/${selectedDocument?._id}`
              }
              target="_blank"
              isDisabled={!selectedDocument}
              bg={theme.primary}
              _hover={{ bg: theme.info }}
            >
              İndir
            </Button>
            <Button onClick={onDocViewerClose}>Kapat</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default JuriEkrani; 