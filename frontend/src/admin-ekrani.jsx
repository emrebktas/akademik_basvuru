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
import axios from 'axios';

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
    durum: 'Açık'
  });
  
  // İşlenmemiş tarih değerlerini tutmak için
  const [dateValues, setDateValues] = useState({
    basvuru_baslangic_tarihi: '',
    basvuru_bitis_tarihi: ''
  });

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
    
    setFormData({
      ...formData,
      [name]: value
    });
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
          <FormLabel>Kriter ID</FormLabel>
          <Input
            name="criteria"
            value={formData.criteria}
            onChange={handleChange}
            placeholder="Kriter ID'sini girin"
          />
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
  
  const { isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = React.useRef();
  const toast = useToast();

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
      
      setBekleyenBasvuruSayisi(5);
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

  useEffect(() => {
    fetchIlanlar();
  }, [fetchIlanlar]);

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
      durum: ilan.durum
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
      default:
        return 'gray';
    }
  };

  return (
    <Container maxW="8xl" py={8}>
      <Stack spacing={8}>
        <Box>
          <Heading mb={4}>Admin Paneli</Heading>
          <Text color="gray.600">Akademik İlan Yönetim Sistemi</Text>
        </Box>

        {/* İstatistik Kartları */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Aktif İlanlar</StatLabel>
                <StatNumber>{aktifIlanSayisi}</StatNumber>
                <StatHelpText>
                  <HStack>
                    <CalendarIcon />
                    <Text>Başvuruya açık</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Bekleyen Başvurular</StatLabel>
                <StatNumber>{bekleyenBasvuruSayisi}</StatNumber>
                <StatHelpText>Değerlendirme bekliyor</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Toplam İlan</StatLabel>
                <StatNumber>{ilanlar.length}</StatNumber>
                <StatHelpText>Tüm dönemler</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Sekme Menüsü */}
        <Tabs colorScheme="blue" variant="enclosed">
          <TabList>
            <Tab>İlanlar</Tab>
            <Tab>Başvurular</Tab>
            <Tab>Kullanıcılar</Tab>
          </TabList>

          <TabPanels>
            {/* İlanlar Sekmesi */}
            <TabPanel p={0} pt={4}>
              <Card>
                <CardHeader>
                  <Flex justifyContent="space-between" alignItems="center">
                    <Heading size="md">İlan Listesi</Heading>
                    <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={handleCreateIlan}>
                      Yeni İlan
                    </Button>
                  </Flex>
                </CardHeader>
                <CardBody>
                  {loading ? (
                    <Text>Yükleniyor...</Text>
                  ) : ilanlar.length === 0 ? (
                    <Text>Henüz ilan bulunmamaktadır.</Text>
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
                              <Badge colorScheme={getDurumColor(ilan.durum)}>
                                {ilan.durum}
                              </Badge>
                            </Td>
                            <Td>{formatDate(ilan.basvuru_baslangic_tarihi)}</Td>
                            <Td>{formatDate(ilan.basvuru_bitis_tarihi)}</Td>
                            <Td>
                              <Menu>
                                <MenuButton
                                  as={IconButton}
                                  icon={<ChevronDownIcon />}
                                  variant="outline"
                                  size="sm"
                                >
                                  İşlemler
                                </MenuButton>
                                <MenuList>
                                  <MenuItem icon={<EditIcon />} onClick={() => handleEditIlan(ilan)}>
                                    Düzenle
                                  </MenuItem>
                                  <MenuItem icon={<DeleteIcon />} onClick={() => handleDeleteClick(ilan)}>
                                    Sil
                                  </MenuItem>
                                  <MenuItem icon={<InfoIcon />}>
                                    Detaylar
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            {/* Başvurular Sekmesi */}
            <TabPanel>
              <Text>Başvuru yönetimi bu sekmede gösterilecek.</Text>
            </TabPanel>

            {/* Kullanıcılar Sekmesi */}
            <TabPanel>
              <Text>Kullanıcı yönetimi bu sekmede gösterilecek.</Text>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>

      {/* İlan Düzenleme/Oluşturma Modalı */}
      <Modal isOpen={isFormOpen} onClose={onFormClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {isEditing ? 'İlan Düzenle' : 'Yeni İlan Oluştur'}
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
    </Container>
  );
};

export default AdminEkrani;
