// akademik_basvuru/frontend/src/yonetici-ekrani.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Heading,
    Text,
    Button,
    useToast,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Input,
    Select,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    VStack,
    HStack,
    Card,
    CardHeader,
    CardBody,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Grid,
    useDisclosure,
    Badge,
    Spinner,
    Center,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Container,
    SimpleGrid,
    Flex,
    Icon,
    Divider,
    IconButton,
    Tooltip
} from '@chakra-ui/react';
import axios from 'axios';
import { 
    FaFilePdf, 
    FaUserPlus, 
    FaUsers, 
    FaClipboardList, 
    FaTrash,
    FaGraduationCap,
    FaUniversity,
    FaUserGraduate,
    FaCalendarAlt,
    FaSearch,
    FaUpload,
    FaClipboardCheck,
    FaAngleRight,
    FaCog,
    FaChartBar,
    FaFileAlt,
    FaCheckCircle,
    FaClock,
    FaExclamationCircle,
    FaPlus,
    FaEdit,
    FaSignOutAlt
} from 'react-icons/fa';
import { DeleteIcon } from '@chakra-ui/icons';
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

const YoneticiEkrani = () => {
    // State management
    const [stats, setStats] = useState({
        totalPosts: 0,
        totalApplications: 0,
        pendingApplications: 0,
        applicationsInJury: 0
    });
    const [criteria, setCriteria] = useState([]);
    const [applications, setApplications] = useState([]);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [availableJurors, setAvailableJurors] = useState([]);
    const [assignedJurors, setAssignedJurors] = useState([]);
    const [selectedApplicationId, setSelectedApplicationId] = useState(null);
    const [removingJuror, setRemovingJuror] = useState(false);
    const [jurorToDelete, setJurorToDelete] = useState(null);
    const toast = useToast();
    const navigate = useNavigate();

    // Modal states
    const { isOpen: isCriteriaModalOpen, onOpen: onCriteriaModalOpen, onClose: onCriteriaModalClose } = useDisclosure();
    const { isOpen: isJuryModalOpen, onOpen: onJuryModalOpen, onClose: onJuryModalClose } = useDisclosure();
    const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
    const { isOpen: isDeleteDialogOpen, onOpen: onDeleteDialogOpen, onClose: onDeleteDialogClose } = useDisclosure();
    const { isOpen: isDeleteCategoryDialogOpen, onOpen: onDeleteCategoryDialogOpen, onClose: onDeleteCategoryDialogClose } = useDisclosure();
    const { isOpen: isDeleteApplicationDialogOpen, onOpen: onDeleteApplicationDialogOpen, onClose: onDeleteApplicationDialogClose } = useDisclosure();
    const { isOpen: isDeleteJurorDialogOpen, onOpen: onDeleteJurorDialogOpen, onClose: onDeleteJurorDialogClose } = useDisclosure();

    // Form states
    const [newCriteria, setNewCriteria] = useState({
        position_type: '',
        criteria: [],
        total_minimum_points: 0
    });

    const [newJury, setNewJury] = useState({
        juryMembers: []
    });     

    const [editingCriteria, setEditingCriteria] = useState(null);
    const [criteriaToDelete, setCriteriaToDelete] = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState({ criteriaIndex: null, categoryIndex: null });
    const [applicationToDelete, setApplicationToDelete] = useState(null);
    const cancelRef = React.useRef();
    const cancelCategoryRef = React.useRef();
    const cancelApplicationRef = React.useRef();

    const fetchDashboardData = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const [statsRes, criteriaRes] = await Promise.all([
                axios.get('/api/yonetici/dashboard', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/yonetici/criteria', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setStats(statsRes.data || {
                totalPosts: 0,
                totalApplications: 0,
                pendingApplications: 0,
                applicationsInJury: 0
            });
            setCriteria(criteriaRes.data || []);
            setLoading(false);

            if (!criteriaRes.data?.length) {
                toast({
                    title: 'Bilgi',
                    description: 'Henüz kriter tanımlanmamış. Yeni kriter oluşturabilirsiniz.',
                    status: 'info',
                    duration: 5000,
                    isClosable: true,
                });
            }
        } catch (err) {
            console.error('Dashboard data fetch error:', err.response?.data || err.message);
            toast({
                title: 'Hata',
                description: err.response?.data?.message || 'Veriler alınırken bir hata oluştu',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
        }
    }, [toast]);

    const fetchPosts = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/yonetici/posts', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data && Array.isArray(response.data)) {
                setPosts(response.data);
                console.log('Posts fetched:', response.data);
            } else {
                console.error('Invalid posts data format:', response.data);
                setPosts([]);
            }
            
            if (!response.data?.length) {
                toast({
                    title: 'Bilgi',
                    description: 'Henüz ilan bulunmamaktadır.',
                    status: 'info',
                    duration: 5000,
                    isClosable: true,
                });
            }
        } catch (err) {
            console.error('Posts fetch error:', err.response?.data || err.message);
            toast({
                title: 'Hata',
                description: err.response?.data?.message || 'İlanlar alınırken bir hata oluştu',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            setPosts([]);
        }
    }, [toast]);

    useEffect(() => {
        fetchDashboardData();
        fetchPosts();
    }, [fetchDashboardData, fetchPosts]);

    const fetchApplications = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/yonetici/posts/${postId}/applications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApplications(response.data);
        } catch (err) {
            console.error('Applications fetch error:', err);
            toast({
                title: 'Hata',
                description: 'Başvurular alınırken bir hata oluştu',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleCreateCriteria = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/yonetici/criteria', newCriteria, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast({
                title: 'Başarılı',
                description: 'Kriter başarıyla oluşturuldu',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onCriteriaModalClose();
            fetchDashboardData();
        } catch (err) {
            console.error('Criteria creation error:', err);
            toast({
                title: 'Hata',
                description: 'Kriter oluşturulurken bir hata oluştu',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const fetchAvailableJurors = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/yonetici/available-jurors', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAvailableJurors(response.data);
        } catch (err) {
            console.error('Error fetching available jurors:', err);
            toast({
                title: 'Hata',
                description: 'Jüri üyeleri alınırken bir hata oluştu',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const fetchAssignedJurors = async (applicationId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/yonetici/applications/${applicationId}/jurors`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssignedJurors(response.data);
        } catch (err) {
            console.error('Error fetching assigned jurors:', err);
            toast({
                title: 'Hata',
                description: 'Atanmış jüri üyeleri alınırken bir hata oluştu',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleAssignJury = async () => {
        try {
            if (!selectedApplicationId) {
                toast({
                    title: 'Hata',
                    description: 'Lütfen bir başvuru seçin',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
                return;
            }

            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.post(`/api/yonetici/applications/${selectedApplicationId}/assign-jury`, newJury, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast({
                title: 'Başarılı',
                description: 'Jüri başarıyla atandı',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onJuryModalClose();
            
            // Refresh data
            await fetchAssignedJurors(selectedApplicationId);
            await fetchDashboardData();
            
            // Refresh applications list to show updated status
            const currentPostId = applications.length > 0 ? applications[0].ilan_id : null;
            if (currentPostId) {
                await fetchApplications(currentPostId);
            }
            
            setLoading(false);
        } catch (err) {
            console.error('Jury assignment error:', err);
            toast({
                title: 'Hata',
                description: err.response?.data?.error || 'Jüri atanırken bir hata oluştu',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            setLoading(false);
        }
    };

    const handleGenerateAtamaYonergesi = async (applicationId) => {
        try {
            const token = localStorage.getItem('token');
            // Önce başvuru verilerini alıyoruz
            const appResponse = await axios.get(`/api/yonetici/applications/${applicationId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const applicationData = appResponse.data;
            console.log("Başvuru verisi:", applicationData);
            
            // PDF'i oluşturmak için gerekli verileri hazırla
            const pdfData = {
                academic_post: applicationData.ilan_id?.kademe || 'Dr. Öğr. Üyesi',
                kademe: applicationData.ilan_id?.kademe || 'Dr. Öğr. Üyesi',
                fieldGroup: applicationData.ilan_id?.alan || 'saglik-fen',
                personalInfo: {
                    fullName: `${applicationData.aday_id?.ad || ''} ${applicationData.aday_id?.soyad || ''}`,
                    languageExam: applicationData.aday_id?.yabanci_dil || 'YDS',
                    languageScore: applicationData.aday_id?.yabanci_dil_puani || '80'
                },
                publications: applicationData.yayinlar || [],
                stats: {
                    totalCount: applicationData.yayinlar?.length || 0,
                    a1a2Count: applicationData.yayinlar?.filter(p => p.category === 'A1' || p.category === 'A2').length || 0,
                    a1a4Count: applicationData.yayinlar?.filter(p => ['A1', 'A2', 'A3', 'A4'].includes(p.category)).length || 0,
                    a1a5Count: applicationData.yayinlar?.filter(p => ['A1', 'A2', 'A3', 'A4', 'A5'].includes(p.category)).length || 0,
                    mainAuthorCount: applicationData.yayinlar?.filter(p => p.isMainAuthor).length || 0,
                    totalPoints: applicationData.puan || 0
                },
                criteria: applicationData.puan_dagilimi || [],
                totalPoints: applicationData.puan || 0
            };
            
            console.log("PDF verisi:", pdfData);
            
            // PDF dosyasını oluştur ve indir
            const response = await axios.post('/api/generate-pdf/atama-yonergesi', pdfData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${applicationData.aday_id?.ad}-${applicationData.aday_id?.soyad}-${applicationData.ilan_id?.ilan_basligi}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            
            // Show success message
            toast({
                title: 'Başarılı',
                description: 'Önizleme PDF dosyası başarıyla indirildi',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (err) {
            console.error('Önizleme PDF oluşturma hatası:', err);
            toast({
                title: 'Hata',
                description: 'Önizleme PDF oluşturulurken bir hata oluştu',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleEditCriteria = (criteria) => {
        setEditingCriteria(criteria);
        setNewCriteria({
            position_type: criteria.position_type,
            criteria: criteria.criteria,
            total_minimum_points: criteria.total_minimum_points
        });
        onEditModalOpen();
    };

    const handleUpdateCriteria = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/yonetici/criteria/${editingCriteria._id}`, newCriteria, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast({
                title: 'Başarılı',
                description: 'Kriter başarıyla güncellendi',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onEditModalClose();
            fetchDashboardData();
        } catch (err) {
            console.error('Criteria update error:', err);
            toast({
                title: 'Hata',
                description: 'Kriter güncellenirken bir hata oluştu',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleDeleteCriteria = async (criteriaId) => {
        setCriteriaToDelete(criteriaId);
        onDeleteDialogOpen();
    };

    const confirmDeleteCriteria = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/yonetici/criteria/${criteriaToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast({
                title: 'Başarılı',
                description: 'Kriter başarıyla silindi',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onDeleteDialogClose();
            fetchDashboardData();
        } catch (err) {
            console.error('Criteria deletion error:', err);
            toast({
                title: 'Hata',
                description: 'Kriter silinirken bir hata oluştu',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleDeleteCategory = (criteriaIndex, categoryIndex) => {
        setCategoryToDelete({ criteriaIndex, categoryIndex });
        onDeleteCategoryDialogOpen();
    };

    const confirmDeleteCategory = () => {
        const updatedCriteria = [...newCriteria.criteria];
        updatedCriteria.splice(categoryToDelete.categoryIndex, 1);
        setNewCriteria({ ...newCriteria, criteria: updatedCriteria });
        onDeleteCategoryDialogClose();
    };

    const handleDeleteApplication = (applicationId) => {
        setApplicationToDelete(applicationId);
        onDeleteApplicationDialogOpen();
    };

    const confirmDeleteApplication = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`/api/yonetici/applications/${applicationToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast({
                    title: 'Başarılı',
                    description: 'Başvuru başarıyla silindi.',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });

                // Başvuru listesini güncelle
                setApplications(applications.filter(app => app._id !== applicationToDelete));
                
                // Dashboard istatistiklerini güncelle
                fetchDashboardData();
            } else {
                throw new Error(response.data.error || 'Silme işlemi başarısız');
            }

            onDeleteApplicationDialogClose();
        } catch (err) {
            console.error('Application deletion error:', err);
            toast({
                title: 'Hata',
                description: err.response?.data?.error || 'Başvuru silinirken bir hata oluştu',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            onDeleteApplicationDialogClose();
        }
    };

    const openJuryModal = async (applicationId) => {
        setSelectedApplicationId(applicationId);
        setNewJury({ juryMembers: [] });
        await fetchAvailableJurors();
        await fetchAssignedJurors(applicationId);
        onJuryModalOpen();
    };

    const addJuryMember = () => {
        setNewJury({
            ...newJury,
            juryMembers: [...newJury.juryMembers, { user_id: '', role: 'Üye' }]
        });
    };

    const removeJuryMember = (index) => {
        const updatedMembers = [...newJury.juryMembers];
        updatedMembers.splice(index, 1);
        setNewJury({ ...newJury, juryMembers: updatedMembers });
    };

    const updateJuryMember = (index, field, value) => {
        const updatedMembers = [...newJury.juryMembers];
        updatedMembers[index] = {
            ...updatedMembers[index],
            [field]: value
        };
        setNewJury({ ...newJury, juryMembers: updatedMembers });
    };

    const handleDeleteJuror = (evaluationId) => {
        setJurorToDelete(evaluationId);
        onDeleteJurorDialogOpen();
    };

    const confirmDeleteJuror = async () => {
        try {
            setRemovingJuror(true);
            const token = localStorage.getItem('token');
            await axios.delete(`/api/yonetici/evaluations/${jurorToDelete}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast({
                title: 'Başarılı',
                description: 'Jüri üyesi başarıyla kaldırıldı',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            // Refresh data
            await fetchAssignedJurors(selectedApplicationId);
            await fetchDashboardData();
            
            // Refresh applications list to show updated status
            const currentPostId = applications.length > 0 ? applications[0].ilan_id : null;
            if (currentPostId) {
                await fetchApplications(currentPostId);
            }
            
            onDeleteJurorDialogClose();
            setRemovingJuror(false);
        } catch (err) {
            console.error('Error removing juror:', err);
            toast({
                title: 'Hata',
                description: err.response?.data?.error || 'Jüri üyesi kaldırılırken bir hata oluştu',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
            setRemovingJuror(false);
        }
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

    if (loading) {
        return (
            <Center h="100vh">
                <Spinner size="xl" />
            </Center>
        );
    }

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
                            <Heading size="xl" mb={4}>Yönetici Paneli</Heading>
                            <Divider my={4} borderColor={theme.tertiary} width="60%" mx="auto" opacity="0.5" />
                            <Text fontSize="lg">Akademik başvuru yönetim ve değerlendirme sistemi</Text>
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

            <Container maxW="container.xl" py={4}>
                {/* Dashboard Stats */}
                <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
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
                                        <Icon as={FaFileAlt} boxSize="20px" />
                                    </Flex>
                                    <StatLabel fontSize="lg">Toplam İlan</StatLabel>
                                </Flex>
                                <StatNumber fontSize="3xl" color={theme.primary}>{stats.totalPosts}</StatNumber>
                                <StatHelpText>Aktif ve pasif tüm ilanlar</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card bg="white" boxShadow="md" borderRadius="lg">
                        <CardBody>
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
                                <StatNumber fontSize="3xl" color={theme.info}>{stats.totalApplications}</StatNumber>
                                <StatHelpText>Tüm başvurular</StatHelpText>
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
                                    <StatLabel fontSize="lg">Bekleyen Başvuru</StatLabel>
                                </Flex>
                                <StatNumber fontSize="3xl" color={theme.warning}>{stats.pendingApplications}</StatNumber>
                                <StatHelpText>Değerlendirme bekleyen</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>

                    <Card bg="white" boxShadow="md" borderRadius="lg">
                        <CardBody>
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
                                    <StatLabel fontSize="lg">Jüri Değerlendirmesinde</StatLabel>
                                </Flex>
                                <StatNumber fontSize="3xl" color={theme.tertiary}>{stats.applicationsInJury}</StatNumber>
                                <StatHelpText>Aktif değerlendirmeler</StatHelpText>
                            </Stat>
                        </CardBody>
                    </Card>
                </SimpleGrid>

                {/* Main Content */}
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
                    <CardBody p={6}>
                        <Tabs variant="soft-rounded" colorScheme="blue">
                            <TabList mb={4}>
                                <Tab>
                                    <HStack spacing={2}>
                                        <Icon as={FaCog} />
                                        <Text>Kriter Yönetimi</Text>
                                    </HStack>
                                </Tab>
                                <Tab>
                                    <HStack spacing={2}>
                                        <Icon as={FaFileAlt} />
                                        <Text>Başvurular</Text>
                                    </HStack>
                                </Tab>
                                <Tab>
                                    <HStack spacing={2}>
                                        <Icon as={FaUsers} />
                                        <Text>Jüri Atamaları</Text>
                                    </HStack>
                                </Tab>
                            </TabList>

                            <TabPanels>
                                {/* Kriter Yönetimi Tab */}
                                <TabPanel>
                                    <Button 
                                        colorScheme="blue" 
                                        mb={4} 
                                        onClick={onCriteriaModalOpen}
                                        bg={theme.primary}
                                        _hover={{ bg: theme.info }}
                                        leftIcon={<Icon as={FaPlus} />}
                                    >
                                        Yeni Kriter Oluştur
                                    </Button>

                                    <Table variant="simple">
                                        <Thead>
                                            <Tr>
                                                <Th>Pozisyon</Th>
                                                <Th>Kriterler</Th>
                                                <Th>Minimum Puan</Th>
                                                <Th>İşlemler</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {criteria.map((item) => (
                                                <Tr key={item._id}>
                                                    <Td>{item.position_type}</Td>
                                                    <Td>
                                                        {item.criteria.map((cat) => (
                                                            <Box key={cat.category} mb={2}>
                                                                <Text fontWeight="bold">{cat.category}</Text>
                                                                {cat.sub_criteria.map((sub) => (
                                                                    <Text key={sub.title} ml={4}>
                                                                        - {sub.title} ({sub.points} puan)
                                                                    </Text>
                                                                ))}
                                                            </Box>
                                                        ))}
                                                    </Td>
                                                    <Td>{item.total_minimum_points}</Td>
                                                    <Td>
                                                        <HStack spacing={2}>
                                                            <Button 
                                                                size="sm" 
                                                                colorScheme="blue" 
                                                                onClick={() => handleEditCriteria(item)}
                                                                leftIcon={<Icon as={FaEdit} />}
                                                            >
                                                                Düzenle
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                colorScheme="red"
                                                                onClick={() => handleDeleteCriteria(item._id)}
                                                                leftIcon={<Icon as={FaTrash} />}
                                                            >
                                                                Sil
                                                            </Button>
                                                        </HStack>
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </TabPanel>

                                {/* Başvurular Tab */}
                                <TabPanel>
                                    <Select
                                        placeholder="İlan Seçin"
                                        mb={4}
                                        onChange={(e) => {
                                            const postId = e.target.value;
                                            if (postId) {
                                                fetchApplications(postId);
                                            }
                                        }}
                                    >
                                        {posts.map((post) => (
                                            <option key={post._id} value={post._id}>
                                                {post.ilan_basligi} - {post.kademe}
                                            </option>
                                        ))}
                                    </Select>

                                    {loading ? (
                                        <Center p={8}>
                                            <Spinner size="xl" color={theme.primary} />
                                        </Center>
                                    ) : applications.length > 0 ? (
                                        <Table variant="simple">
                                            <Thead>
                                                <Tr>
                                                    <Th>Aday</Th>
                                                    <Th>Başvuru Tarihi</Th>
                                                    <Th>Durum</Th>
                                                    <Th>İşlemler</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {applications.map((app) => (
                                                    <Tr key={app._id}>
                                                        <Td>{app.aday_id?.ad} {app.aday_id?.soyad}</Td>
                                                        <Td>{new Date(app.created_at).toLocaleDateString('tr-TR')}</Td>
                                                        <Td>
                                                            <Badge 
                                                                colorScheme={
                                                                    app.durum_gecmisi?.[0]?.durum === 'Tamamlandı' ? 'green' :
                                                                    app.durum_gecmisi?.[0]?.durum === 'Beklemede' ? 'yellow' :
                                                                    'blue'
                                                                }
                                                                borderRadius="md"
                                                                px={2}
                                                                py={1}
                                                            >
                                                                {app.durum_gecmisi?.[0]?.durum || 'Beklemede'}
                                                            </Badge>
                                                        </Td>
                                                        <Td>
                                                            <HStack spacing={2}>
                                                                <Button
                                                                    size="sm"
                                                                    colorScheme="teal"
                                                                    onClick={() => handleGenerateAtamaYonergesi(app._id)}
                                                                    leftIcon={<Icon as={FaFilePdf} />}
                                                                >
                                                                    Önizleme PDF
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    colorScheme="green"
                                                                    onClick={() => openJuryModal(app._id)}
                                                                    leftIcon={<Icon as={FaUsers} />}
                                                                >
                                                                    Jüri Ata
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    colorScheme="red"
                                                                    onClick={() => handleDeleteApplication(app._id)}
                                                                    leftIcon={<Icon as={FaTrash} />}
                                                                >
                                                                    Sil
                                                                </Button>
                                                            </HStack>
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    ) : (
                                        <Alert status="info" borderRadius="md">
                                            <AlertIcon />
                                            <Box>
                                                <AlertTitle>Bilgi</AlertTitle>
                                                <AlertDescription>
                                                    Seçilen ilan için henüz başvuru bulunmamaktadır.
                                                </AlertDescription>
                                            </Box>
                                        </Alert>
                                    )}
                                </TabPanel>

                                {/* Jüri Atamaları Tab */}
                                <TabPanel>
                                    <Select
                                        placeholder="İlan Seçin"
                                        mb={4}
                                        onChange={(e) => {
                                            const postId = e.target.value;
                                            if (postId) {
                                                fetchApplications(postId);
                                            }
                                        }}
                                    >
                                        {posts.map((post) => (
                                            <option key={post._id} value={post._id}>
                                                {post.ilan_basligi} - {post.kademe}
                                            </option>
                                        ))}
                                    </Select>

                                    {loading ? (
                                        <Center p={8}>
                                            <Spinner size="xl" color={theme.primary} />
                                        </Center>
                                    ) : applications.length > 0 ? (
                                        <Table variant="simple">
                                            <Thead>
                                                <Tr>
                                                    <Th>Aday</Th>
                                                    <Th>Başvuru Tarihi</Th>
                                                    <Th>Atanmış Jüri Üyeleri</Th>
                                                    <Th>İşlemler</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {applications.map((app) => (
                                                    <Tr key={app._id}>
                                                        <Td>{app.aday_id?.ad} {app.aday_id?.soyad}</Td>
                                                        <Td>{new Date(app.created_at).toLocaleDateString('tr-TR')}</Td>
                                                        <Td>
                                                            <Button 
                                                                size="sm" 
                                                                colorScheme="blue"
                                                                onClick={() => {
                                                                    fetchAssignedJurors(app._id);
                                                                    setSelectedApplicationId(app._id);
                                                                    onJuryModalOpen();
                                                                }}
                                                                leftIcon={<Icon as={FaUsers} />}
                                                            >
                                                                Jüri Üyelerini Görüntüle
                                                            </Button>
                                                        </Td>
                                                        <Td>
                                                            <Button
                                                                size="sm"
                                                                colorScheme="green"
                                                                onClick={() => openJuryModal(app._id)}
                                                                leftIcon={<Icon as={FaUserPlus} />}
                                                            >
                                                                Jüri Ekle
                                                            </Button>
                                                        </Td>
                                                    </Tr>
                                                ))}
                                            </Tbody>
                                        </Table>
                                    ) : (
                                        <Alert status="info" borderRadius="md">
                                            <AlertIcon />
                                            <Box>
                                                <AlertTitle>Bilgi</AlertTitle>
                                                <AlertDescription>
                                                    Seçilen ilan için henüz başvuru bulunmamaktadır.
                                                </AlertDescription>
                                            </Box>
                                        </Alert>
                                    )}
                                </TabPanel>
                            </TabPanels>
                        </Tabs>
                    </CardBody>
                </Card>
            </Container>

            {/* Kriter Oluşturma Modal */}
            <Modal isOpen={isCriteriaModalOpen} onClose={onCriteriaModalClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Yeni Kriter Oluştur</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>Pozisyon Tipi</FormLabel>
                                <Select
                                    value={newCriteria.position_type}
                                    onChange={(e) =>
                                        setNewCriteria({ ...newCriteria, position_type: e.target.value })
                                    }
                                >
                                    <option value="Dr. Öğr. Üyesi">Dr. Öğr. Üyesi</option>
                                    <option value="Doçent">Doçent</option>
                                    <option value="Profesör">Profesör</option>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Minimum Toplam Puan</FormLabel>
                                <NumberInput
                                    value={newCriteria.total_minimum_points}
                                    onChange={(value) =>
                                        setNewCriteria({ ...newCriteria, total_minimum_points: value })
                                    }
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            {/* Add dynamic criteria fields here */}
                            <Button colorScheme="blue" onClick={handleCreateCriteria}>
                                Kriter Oluştur
                            </Button>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Jüri Atama Modal */}
            <Modal isOpen={isJuryModalOpen} onClose={onJuryModalClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Jüri Atama</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4} align="stretch">
                            {/* Mevcut atanmış jüri üyeleri */}
                            {assignedJurors.length > 0 && (
                                <Box>
                                    <Heading size="md" mb={2}>Atanmış Jüri Üyeleri</Heading>
                                    <Table variant="simple" size="sm">
                                        <Thead>
                                            <Tr>
                                                <Th>Ad Soyad</Th>
                                                <Th>Email</Th>
                                                <Th>Departman</Th>
                                                <Th>Durum</Th>
                                                <Th>İşlemler</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {assignedJurors.map((juror) => (
                                                <Tr key={juror._id}>
                                                    <Td>{juror.juror_id?.ad} {juror.juror_id?.soyad}</Td>
                                                    <Td>{juror.juror_id?.email}</Td>
                                                    <Td>{juror.juror_id?.department}</Td>
                                                    <Td>
                                                        <Badge 
                                                            colorScheme={
                                                                juror.status === 'Tamamlandı' ? 'green' : 
                                                                juror.status === 'Değerlendirme Devam Ediyor' ? 'blue' : 'yellow'
                                                            }
                                                        >
                                                            {juror.status}
                                                        </Badge>
                                                    </Td>
                                                    <Td>
                                                        <Button
                                                            size="xs"
                                                            colorScheme="red"
                                                            leftIcon={<DeleteIcon />}
                                                            isDisabled={juror.status !== 'Beklemede'}
                                                            onClick={() => handleDeleteJuror(juror._id)}
                                                        >
                                                            Kaldır
                                                        </Button>
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </Box>
                            )}

                            {/* Yeni jüri üyesi atama formu */}
                            <Box>
                                <Heading size="md" mb={2}>Yeni Jüri Üyesi Ekle</Heading>
                                
                                {newJury.juryMembers.map((member, index) => (
                                    <HStack key={index} spacing={4} mt={2} align="flex-end">
                                        <FormControl>
                                            <FormLabel>Jüri Üyesi {index + 1}</FormLabel>
                                            <Select
                                                placeholder="Jüri Üyesi Seçin"
                                                value={member.user_id}
                                                onChange={(e) => updateJuryMember(index, 'user_id', e.target.value)}
                                            >
                                                {availableJurors.map(juror => (
                                                    <option key={juror._id} value={juror._id}>
                                                        {juror.ad} {juror.soyad} - {juror.department}
                                                    </option>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <FormControl width="150px">
                                            <FormLabel>Rolü</FormLabel>
                                            <Select
                                                value={member.role || 'Üye'}
                                                onChange={(e) => updateJuryMember(index, 'role', e.target.value)}
                                            >
                                                <option value="Başkan">Başkan</option>
                                                <option value="Üye">Üye</option>
                                            </Select>
                                        </FormControl>
                                        <Button 
                                            colorScheme="red" 
                                            onClick={() => removeJuryMember(index)}
                                        >
                                            <DeleteIcon />
                                        </Button>
                                    </HStack>
                                ))}

                                <Button mt={4} onClick={addJuryMember} leftIcon={<FaUserPlus />}>
                                    Jüri Üyesi Ekle
                                </Button>
                            </Box>

                            <Button 
                                colorScheme="blue" 
                                isDisabled={newJury.juryMembers.length === 0 || newJury.juryMembers.some(m => !m.user_id)}
                                onClick={handleAssignJury}
                                mt={4}
                            >
                                Jüri Ata
                            </Button>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Kriter Düzenleme Modalı */}
            <Modal isOpen={isEditModalOpen} onClose={onEditModalClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Kriter Düzenle</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl>
                                <FormLabel>Pozisyon Tipi</FormLabel>
                                <Select
                                    value={newCriteria.position_type}
                                    onChange={(e) =>
                                        setNewCriteria({ ...newCriteria, position_type: e.target.value })
                                    }
                                >
                                    <option value="Dr. Öğr. Üyesi">Dr. Öğr. Üyesi</option>
                                    <option value="Doçent">Doçent</option>
                                    <option value="Profesör">Profesör</option>
                                </Select>
                            </FormControl>

                            <FormControl>
                                <FormLabel>Minimum Toplam Puan</FormLabel>
                                <NumberInput
                                    value={newCriteria.total_minimum_points}
                                    onChange={(value) =>
                                        setNewCriteria({ ...newCriteria, total_minimum_points: value })
                                    }
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                            </FormControl>

                            {/* Kriter Kategorileri */}
                            {newCriteria.criteria.map((category, catIndex) => (
                                <Box key={catIndex} width="100%" p={4} borderWidth={1} borderRadius="md">
                                    <HStack justify="space-between" mb={2}>
                                        <FormControl>
                                            <FormLabel>Kategori Adı</FormLabel>
                                            <Input
                                                value={category.category}
                                                onChange={(e) => {
                                                    const updatedCriteria = [...newCriteria.criteria];
                                                    updatedCriteria[catIndex].category = e.target.value;
                                                    setNewCriteria({ ...newCriteria, criteria: updatedCriteria });
                                                }}
                                            />
                                        </FormControl>
                                        <Button
                                            colorScheme="red"
                                            size="sm"
                                            onClick={() => handleDeleteCategory(0, catIndex)}
                                        >
                                            Kategoriyi Sil
                                        </Button>
                                    </HStack>

                                    {/* Alt Kriterler */}
                                    {category.sub_criteria.map((sub, subIndex) => (
                                        <Box key={subIndex} ml={4} mt={2} p={2} borderWidth={1} borderRadius="md">
                                            <HStack justify="space-between" mb={2}>
                                                <FormControl>
                                                    <FormLabel>Alt Kriter Adı</FormLabel>
                                                    <Input
                                                        value={sub.title}
                                                        onChange={(e) => {
                                                            const updatedCriteria = [...newCriteria.criteria];
                                                            updatedCriteria[catIndex].sub_criteria[subIndex].title = e.target.value;
                                                            setNewCriteria({ ...newCriteria, criteria: updatedCriteria });
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormControl>
                                                    <FormLabel>Puan</FormLabel>
                                                    <NumberInput
                                                        value={sub.points}
                                                        onChange={(value) => {
                                                            const updatedCriteria = [...newCriteria.criteria];
                                                            updatedCriteria[catIndex].sub_criteria[subIndex].points = value;
                                                            setNewCriteria({ ...newCriteria, criteria: updatedCriteria });
                                                        }}
                                                    >
                                                        <NumberInputField />
                                                        <NumberInputStepper>
                                                            <NumberIncrementStepper />
                                                            <NumberDecrementStepper />
                                                        </NumberInputStepper>
                                                    </NumberInput>
                                                </FormControl>
                                                <Button
                                                    colorScheme="red"
                                                    size="sm"
                                                    onClick={() => {
                                                        const updatedCriteria = [...newCriteria.criteria];
                                                        updatedCriteria[catIndex].sub_criteria.splice(subIndex, 1);
                                                        setNewCriteria({ ...newCriteria, criteria: updatedCriteria });
                                                    }}
                                                >
                                                    Sil
                                                </Button>
                                            </HStack>
                                        </Box>
                                    ))}

                                    <Button
                                        mt={2}
                                        size="sm"
                                        onClick={() => {
                                            const updatedCriteria = [...newCriteria.criteria];
                                            updatedCriteria[catIndex].sub_criteria.push({
                                                title: '',
                                                points: 0
                                            });
                                            setNewCriteria({ ...newCriteria, criteria: updatedCriteria });
                                        }}
                                    >
                                        Alt Kriter Ekle
                                    </Button>
                                </Box>
                            ))}

                            <Button
                                colorScheme="blue"
                                onClick={() => {
                                    setNewCriteria({
                                        ...newCriteria,
                                        criteria: [
                                            ...newCriteria.criteria,
                                            {
                                                category: '',
                                                sub_criteria: []
                                            }
                                        ]
                                    });
                                }}
                            >
                                Kategori Ekle
                            </Button>

                            <Button colorScheme="blue" onClick={handleUpdateCriteria}>
                                Güncelle
                            </Button>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Silme Onay Dialog */}
            <AlertDialog
                isOpen={isDeleteDialogOpen}
                leastDestructiveRef={cancelRef}
                onClose={onDeleteDialogClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Kriteri Sil
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Bu kriteri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onDeleteDialogClose}>
                                İptal
                            </Button>
                            <Button colorScheme="red" onClick={confirmDeleteCriteria} ml={3}>
                                Sil
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            {/* Kategori Silme Onay Dialog */}
            <AlertDialog
                isOpen={isDeleteCategoryDialogOpen}
                leastDestructiveRef={cancelCategoryRef}
                onClose={onDeleteCategoryDialogClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Kategoriyi Sil
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Bu kategoriyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelCategoryRef} onClick={onDeleteCategoryDialogClose}>
                                İptal
                            </Button>
                            <Button colorScheme="red" onClick={confirmDeleteCategory} ml={3}>
                                Sil
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            {/* Başvuru Silme Onay Dialog */}
            <AlertDialog
                isOpen={isDeleteApplicationDialogOpen}
                leastDestructiveRef={cancelApplicationRef}
                onClose={onDeleteApplicationDialogClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Başvuruyu Sil
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Bu başvuruyu silmek istediğinizden emin misiniz? 
                            Bu işlem geri alınamaz ve başvuruyla ilişkili tüm belgeler silinecektir.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelApplicationRef} onClick={onDeleteApplicationDialogClose}>
                                İptal
                            </Button>
                            <Button colorScheme="red" onClick={confirmDeleteApplication} ml={3}>
                                Sil
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>

            {/* Jüri Silme Onay Dialog */}
            <AlertDialog
                isOpen={isDeleteJurorDialogOpen}
                leastDestructiveRef={cancelRef}
                onClose={onDeleteJurorDialogClose}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Jüri Üyesini Kaldır
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Bu jüri üyesini başvurudan kaldırmak istediğinizden emin misiniz?
                            Bu işlem geri alınamaz.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onDeleteJurorDialogClose} isDisabled={removingJuror}>
                                İptal
                            </Button>
                            <Button 
                                colorScheme="red" 
                                onClick={confirmDeleteJuror} 
                                ml={3}
                                isLoading={removingJuror}
                                loadingText="Kaldırılıyor..."
                            >
                                Kaldır
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
};

export default YoneticiEkrani;