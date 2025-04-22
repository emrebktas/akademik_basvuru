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
    AlertDialogOverlay
} from '@chakra-ui/react';
import axios from 'axios';
import { FaFilePdf, FaUserPlus, FaUsers, FaClipboardList } from 'react-icons/fa';

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
    const toast = useToast();

    // Modal states
    const { isOpen: isCriteriaModalOpen, onOpen: onCriteriaModalOpen, onClose: onCriteriaModalClose } = useDisclosure();
    const { isOpen: isJuryModalOpen, onOpen: onJuryModalOpen, onClose: onJuryModalClose } = useDisclosure();
    const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
    const { isOpen: isDeleteDialogOpen, onOpen: onDeleteDialogOpen, onClose: onDeleteDialogClose } = useDisclosure();
    const { isOpen: isDeleteCategoryDialogOpen, onOpen: onDeleteCategoryDialogOpen, onClose: onDeleteCategoryDialogClose } = useDisclosure();

    // Form states
    const [newCriteria, setNewCriteria] = useState({
        position_type: '',
        criteria: [],
        total_minimum_points: 0
    });

    const [newJury, setNewJury] = useState({
        postId: '',
        members: Array(5).fill({ user_id: '', role: 'Üye' })
    });     

    const [editingCriteria, setEditingCriteria] = useState(null);
    const [criteriaToDelete, setCriteriaToDelete] = useState(null);
    const [categoryToDelete, setCategoryToDelete] = useState({ criteriaIndex: null, categoryIndex: null });
    const cancelRef = React.useRef();
    const cancelCategoryRef = React.useRef();

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

    const handleAssignJury = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/yonetici/jury', newJury, {
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
            fetchDashboardData();
        } catch (err) {
            console.error('Jury assignment error:', err);
            toast({
                title: 'Hata',
                description: 'Jüri atanırken bir hata oluştu',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleGenerateTable5 = async (applicationId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/yonetici/applications/${applicationId}/table5`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `tablo5-${applicationId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Table 5 generation error:', err);
            toast({
                title: 'Hata',
                description: 'Tablo 5 oluşturulurken bir hata oluştu',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Beklemede':
                return 'yellow';
            case 'Juri Değerlendirmesinde':
                return 'blue';
            case 'Onaylandı':
                return 'green';
            default:
                return 'gray';
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

    if (loading) {
        return (
            <Center h="100vh">
                <Spinner size="xl" />
            </Center>
        );
    }

    return (
        <Box p={4}>
            <Heading mb={6}>Yönetici Paneli</Heading>

            {/* Dashboard Stats */}
            <Grid templateColumns="repeat(4, 1fr)" gap={6} mb={8}>
                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Toplam İlan</StatLabel>
                            <StatNumber>{stats.totalPosts}</StatNumber>
                        </Stat>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Toplam Başvuru</StatLabel>
                            <StatNumber>{stats.totalApplications}</StatNumber>
                        </Stat>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Bekleyen Başvuru</StatLabel>
                            <StatNumber>{stats.pendingApplications}</StatNumber>
                        </Stat>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Juri Değerlendirmesinde</StatLabel>
                            <StatNumber>{stats.applicationsInJury}</StatNumber>
                        </Stat>
                    </CardBody>
                </Card>
            </Grid>

            {/* Main Content Tabs */}
            <Tabs>
                <TabList>
                    <Tab>Kriter Yönetimi</Tab>
                    <Tab>Başvurular</Tab>
                    <Tab>Jüri Atamaları</Tab>
                </TabList>

                <TabPanels>
                    {/* Kriter Yönetimi Tab */}
                    <TabPanel>
                        <Button colorScheme="blue" mb={4} onClick={onCriteriaModalOpen}>
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
                                            <Button 
                                                size="sm" 
                                                colorScheme="blue" 
                                                mr={2}
                                                onClick={() => handleEditCriteria(item)}
                                            >
                                                Düzenle
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                colorScheme="red"
                                                onClick={() => handleDeleteCriteria(item._id)}
                                            >
                                                Sil
                                            </Button>
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
                            <Center>
                                <Spinner size="xl" />
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
                                            <Td>{app.user?.ad} {app.user?.soyad}</Td>
                                            <Td>{new Date(app.created_at).toLocaleDateString('tr-TR')}</Td>
                                            <Td>
                                                <Badge colorScheme={getStatusColor(app.durum)}>
                                                    {app.durum}
                                                </Badge>
                                            </Td>
                                            <Td>
                                                <Button
                                                    size="sm"
                                                    colorScheme="blue"
                                                    mr={2}
                                                    onClick={() => handleGenerateTable5(app._id)}
                                                >
                                                    <FaFilePdf /> Tablo 5
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    colorScheme="green"
                                                    onClick={() => {
                                                        setNewJury({ ...newJury, postId: app.ilan_id });
                                                        onJuryModalOpen();
                                                    }}
                                                >
                                                    <FaUsers /> Jüri Ata
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

                    {/* Jüri Atamaları Tab */}
                    <TabPanel>
                        <Table variant="simple">
                            <Thead>
                                <Tr>
                                    <Th>İlan</Th>
                                    <Th>Jüri Üyeleri</Th>
                                    <Th>Atama Tarihi</Th>
                                    <Th>Durum</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {/* Add jury assignments data here */}
                            </Tbody>
                        </Table>
                    </TabPanel>
                </TabPanels>
            </Tabs>

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
                        <VStack spacing={4}>
                            {newJury.members.map((member, index) => (
                                <HStack key={index} width="100%">
                                    <FormControl>
                                        <FormLabel>Jüri Üyesi {index + 1}</FormLabel>
                                        <Select
                                            placeholder="Jüri Üyesi Seçin"
                                            value={member.user_id}
                                            onChange={(e) => {
                                                const updatedMembers = [...newJury.members];
                                                updatedMembers[index] = {
                                                    ...updatedMembers[index],
                                                    user_id: e.target.value
                                                };
                                                setNewJury({ ...newJury, members: updatedMembers });
                                            }}
                                        >
                                            {/* Add jury member options dynamically */}
                                        </Select>
                                    </FormControl>
                                    <FormControl>
                                        <FormLabel>Rol</FormLabel>
                                        <Select
                                            value={member.role}
                                            onChange={(e) => {
                                                const updatedMembers = [...newJury.members];
                                                updatedMembers[index] = {
                                                    ...updatedMembers[index],
                                                    role: e.target.value
                                                };
                                                setNewJury({ ...newJury, members: updatedMembers });
                                            }}
                                        >
                                            <option value="Başkan">Başkan</option>
                                            <option value="Üye">Üye</option>
                                        </Select>
                                    </FormControl>
                                </HStack>
                            ))}
                            <Button colorScheme="blue" onClick={handleAssignJury}>
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
        </Box>
    );
};

export default YoneticiEkrani;