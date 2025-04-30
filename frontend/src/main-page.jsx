import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Heading, Text, VStack, HStack, Button, useToast, 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, useDisclosure, Badge, Divider, SimpleGrid,
  Card, CardHeader, CardBody, CardFooter, Flex, Spinner, 
  Alert, AlertIcon, AlertTitle, AlertDescription, Icon, Image,
  Skeleton, Progress, List, ListItem, ListIcon, Center
} from '@chakra-ui/react';
import { 
  FaFileAlt, FaCheck, FaTimes, FaClock, FaEye, FaPaperPlane, 
  FaArrowRight, FaGraduationCap, FaUniversity, FaUserGraduate, 
  FaCalendarAlt, FaClipboardList, FaSearch, FaUpload, 
  FaHandshake, FaClipboardCheck, FaAngleRight
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

const MainPage = () => {
  const [ilanlar, setIlanlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchIlanlar();
  }, []);

  const fetchIlanlar = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/applications/public-active-posts');
      
      // Ensure ilanlar is always an array
      if (response.data && Array.isArray(response.data)) {
        setIlanlar(response.data);
      } else if (response.data && response.data.posts && Array.isArray(response.data.posts)) {
        setIlanlar(response.data.posts);
      } else {
        console.error('API response is not in the expected format:', response.data);
        setIlanlar([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('İlanları getirirken hata:', error);
      toast({
        title: 'Hata',
        description: 'İlanlar yüklenirken bir hata oluştu.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIlanlar([]);
      setLoading(false);
    }
  };

  const handleIlanClick = (ilan) => {
    try {
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

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
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
          const getIconByKademe = (kademe) => {
            switch (kademe) {
              case 'Dr. Öğr. Üyesi':
                return FaUserGraduate;
              case 'Doçent':
                return FaGraduationCap;
              case 'Profesör':
                return FaUniversity;
              default:
                return FaGraduationCap;
            }
          };

          const kademIcon = getIconByKademe(ilan.kademe);
          
          return (
            <Card 
              key={ilan._id} 
              boxShadow="md" 
              borderRadius="lg"
              transition="transform 0.2s"
              _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
              bg="white"
              overflow="hidden"
              position="relative"
            >
              <Box 
                position="absolute" 
                top="-20px" 
                right="-20px" 
                bg={`${theme.primary}20`}
                borderRadius="full" 
                w="100px" 
                h="100px"
                zIndex="0"
              />

              <CardHeader bg={theme.light} borderBottom="1px solid" borderColor="gray.100" position="relative" zIndex="1">
                <Flex alignItems="center" mb={2}>
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
                    <Icon as={kademIcon} boxSize="20px" />
                  </Flex>
                  <Heading size="md" color={theme.primary}>{ilan.ilan_basligi}</Heading>
                </Flex>
                <HStack mt={2} spacing={2} flexWrap="wrap">
                  <Badge bg={theme.primary} color="white" borderRadius="md" px={2} py={1} display="flex" alignItems="center">
                    <Icon as={kademIcon} mr={1} />
                    {ilan.kademe}
                  </Badge>
                  
                  <Badge bg={theme.tertiary} color="white" borderRadius="md" px={2} py={1} display="flex" alignItems="center">
                    <Icon as={FaCalendarAlt} mr={1} />
                    {new Date(ilan.basvuru_bitis_tarihi).toLocaleDateString('tr-TR', {day: '2-digit', month: '2-digit'})}
                  </Badge>
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

  // Ana render fonksiyonu
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
          <Box textAlign={{ base: "center", md: "center" }}>
            <Heading size="2xl" mb={4}>Kocaeli Üniversitesi</Heading>
            <Divider my={4} borderColor={`${theme.secondary}`} width="60%" mx="auto" opacity="0.5" />
            <Heading size="lg" mb={6}>Akademik İlan Başvuru Sistemi</Heading>
            <Text fontSize="xl" mb={6}>Akademik ilerleyişiniz için tüm fırsatlar tek bir platformda</Text>
            <HStack spacing={4} justify={{ base: "center", md: "center" }}>
              <Button 
                bg={theme.secondary}
                color="white"
                size="lg"
                leftIcon={<FaGraduationCap />}
                onClick={handleLoginClick}
                _hover={{ bg: "#c0392b" }}
                boxShadow="md"
              >
                Giriş Yap
              </Button>
              <Button 
                bg={theme.tertiary}
                color="white"
                size="lg"
                leftIcon={<FaUniversity />}
                onClick={handleRegisterClick}
                _hover={{ bg: "#16a085" }}
                boxShadow="md"
              >
                Kayıt Ol
              </Button>
            </HStack>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" pb={20}>
        {/* How to Apply Section */}
        <Card borderRadius="lg" boxShadow="md" bg="white" overflow="hidden" mb={10} position="relative">
          <Box 
            position="absolute" 
            top="-30px" 
            right="-30px" 
            bg={`${theme.info}10`}
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
              <Heading size="lg" color={theme.primary}>Başvuru Süreci</Heading>
            </Flex>
          </CardHeader>
          <CardBody p={6}>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              <VStack 
                align="start" 
                p={6} 
                bg={`${theme.light}`} 
                borderRadius="md" 
                boxShadow="sm"
                transition="transform 0.2s"
                _hover={{ transform: 'translateY(-5px)', boxShadow: 'md' }}
                position="relative"
                overflow="hidden"
              >
                <Box 
                  position="absolute" 
                  top="-20px" 
                  right="-20px" 
                  bg={`${theme.secondary}10`}
                  borderRadius="full" 
                  w="80px" 
                  h="80px"
                  zIndex="0"
                />
                <Flex 
                  w={14} h={14} 
                  bg={theme.primary} 
                  color="white" 
                  borderRadius="full" 
                  align="center" 
                  justify="center"
                  mb={4}
                  position="relative"
                  zIndex="1"
                >
                  <Icon as={FaUserGraduate} fontSize="24px" />
                </Flex>
                <Heading size="md" color={theme.primary}>Kayıt Olun</Heading>
                <Text>Sistemimize kayıt olarak akademik başvuru sürecine başlayabilirsiniz.</Text>
              </VStack>
              
              <VStack 
                align="start" 
                p={6} 
                bg={`${theme.light}`} 
                borderRadius="md" 
                boxShadow="sm"
                transition="transform 0.2s"
                _hover={{ transform: 'translateY(-5px)', boxShadow: 'md' }}
                position="relative"
                overflow="hidden"
              >
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
                <Flex 
                  w={14} h={14} 
                  bg={theme.primary} 
                  color="white" 
                  borderRadius="full" 
                  align="center" 
                  justify="center"
                  mb={4}
                  position="relative"
                  zIndex="1"
                >
                  <Icon as={FaSearch} fontSize="24px" />
                </Flex>
                <Heading size="md" color={theme.primary}>İlanları İnceleyin</Heading>
                <Text>Akademik kadro ilanlarını detaylı bir şekilde inceleyerek uygun pozisyonu seçin.</Text>
              </VStack>
              
              <VStack 
                align="start" 
                p={6} 
                bg={`${theme.light}`} 
                borderRadius="md" 
                boxShadow="sm"
                transition="transform 0.2s"
                _hover={{ transform: 'translateY(-5px)', boxShadow: 'md' }}
                position="relative"
                overflow="hidden"
              >
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
                <Flex 
                  w={14} h={14} 
                  bg={theme.primary} 
                  color="white" 
                  borderRadius="full" 
                  align="center" 
                  justify="center"
                  mb={4}
                  position="relative"
                  zIndex="1"
                >
                  <Icon as={FaUpload} fontSize="24px" />
                </Flex>
                <Heading size="md" color={theme.primary}>Başvurunuzu Yapın</Heading>
                <Text>Gerekli belgeleri yükleyerek ve formu doldurarak başvurunuzu tamamlayın.</Text>
              </VStack>
            </SimpleGrid>
            
            <Center mt={10}>
              <Button 
                rightIcon={<FaArrowRight />} 
                bg={theme.primary}
                color="white"
                size="lg"
                onClick={handleLoginClick}
                _hover={{ bg: theme.info }}
                boxShadow="md"
                px={8}
                position="relative"
                overflow="hidden"
              >
                <Box 
                  position="absolute" 
                  left="0" 
                  top="0" 
                  h="100%" 
                  w="0" 
                  bg={`${theme.info}`}
                  transition="all 0.3s"
                  _groupHover={{ w: "100%" }}
                  opacity="0.3"
                />
                <Box position="relative" zIndex="1">
                  Hemen Başvuruya Başlayın
                </Box>
              </Button>
            </Center>
          </CardBody>
        </Card>
        
        {/* Active Posts Section */}
        <Card borderRadius="lg" boxShadow="md" bg="white" overflow="hidden" mb={10} position="relative">
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
                <Icon as={FaFileAlt} boxSize="20px" />
              </Flex>
              <Heading size="lg" color={theme.primary}>Güncel Akademik İlanlar</Heading>
            </Flex>
          </CardHeader>
          <CardBody p={6}>
            {renderIlanCards()}
          </CardBody>
        </Card>
      </Container>

      {/* Footer */}
      <Box bg={theme.primary} color="white" py={8} position="relative" overflow="hidden">
        {/* Decorative Elements */}
        <Box 
          position="absolute" 
          top="-30px" 
          right="10%" 
          bg={`${theme.tertiary}20`}
          borderRadius="full" 
          w="100px" 
          h="100px"
          zIndex="0"
        />
        <Box 
          position="absolute" 
          bottom="-40px" 
          left="15%" 
          bg={`${theme.secondary}20`}
          borderRadius="full" 
          w="150px" 
          h="150px"
          zIndex="0"
        />

        <Container maxW="container.xl" position="relative" zIndex="1">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            <VStack align="start">
              <Heading size="md" mb={4}>Kocaeli Üniversitesi</Heading>
              <HStack mb={2}>
                <Icon as={FaUniversity} />
                <Text>Akademik İlan Başvuru Sistemi</Text>
              </HStack>
              <HStack mt={4}>
                <Icon as={FaCheck} />
                <Text>© {new Date().getFullYear()} Tüm Hakları Saklıdır</Text>
              </HStack>
            </VStack>
            
            <VStack align="start">
              <Heading size="md" mb={4}>İletişim</Heading>
              <HStack mb={2}>
                <Icon as={FaAngleRight} />
                <Text>Kabaoğlu Mah. Baki Komşuoğlu Bulvarı No:515</Text>
              </HStack>
              <HStack mb={2}>
                <Icon as={FaAngleRight} />
                <Text>İzmit/Kocaeli</Text>
              </HStack>
              <HStack mb={2}>
                <Icon as={FaAngleRight} />
                <Text>Tel: 0262 303 10 00</Text>
              </HStack>
              <HStack mb={2}>
                <Icon as={FaAngleRight} />
                <Text>E-posta: info@kocaeli.edu.tr</Text>
              </HStack>
            </VStack>
            
            <VStack align="start">
              <Heading size="md" mb={4}>Hızlı Bağlantılar</Heading>
              <Button variant="link" color="white" leftIcon={<FaAngleRight />} _hover={{ color: theme.light }}>Ana Sayfa</Button>
              <Button variant="link" color="white" leftIcon={<FaAngleRight />} _hover={{ color: theme.light }}>Giriş Yap</Button>
              <Button variant="link" color="white" leftIcon={<FaAngleRight />} _hover={{ color: theme.light }}>Kayıt Ol</Button>
              <Button variant="link" color="white" leftIcon={<FaAngleRight />} _hover={{ color: theme.light }}>Sıkça Sorulan Sorular</Button>
            </VStack>
          </SimpleGrid>
        </Container>
      </Box>

      {/* İlan Detay Modalı */}
      {selectedJob && (
        <Modal 
          isOpen={isOpen} 
          onClose={onClose} 
          size="xl" 
          scrollBehavior="inside"
          closeOnOverlayClick={true}
        >
          <ModalOverlay bg={`${theme.primary}40`} backdropFilter="blur(2px)" />
          <ModalContent borderRadius="lg" boxShadow="xl" overflow="hidden">
            <ModalHeader 
              bg="white"
              borderBottom="1px solid"
              borderColor="gray.200"
              py={4}
            >
              <Flex align="center">
                <Flex 
                  bg={`${theme.primary}20`} 
                  p={2} 
                  borderRadius="full" 
                  color={theme.primary}
                  mr={3}
                  minW="40px"
                  h="40px"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={FaClipboardCheck} boxSize="20px" />
                </Flex>
                <Text fontSize="xl" fontWeight="bold" color={theme.primary}>{selectedJob.ilan_basligi}</Text>
              </Flex>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align="start" spacing={6}>
                <Box width="100%">
                  <Heading size="sm" mb={2} color={theme.primary}>
                    <Flex align="center">
                      <Icon as={FaFileAlt} mr={2} />
                      İlan Açıklaması
                    </Flex>
                  </Heading>
                  <Text whiteSpace="pre-wrap">{selectedJob.ilan_aciklamasi}</Text>
                </Box>
                
                <Divider />
                
                <Box width="100%">
                  <Heading size="sm" mb={2} color={theme.primary}>
                    <Flex align="center">
                      <Icon as={FaUserGraduate} mr={2} />
                      Kademe
                    </Flex>
                  </Heading>
                  <Badge bg={theme.primary} color="white" fontSize="md" px={2} py={1} borderRadius="md">{selectedJob.kademe}</Badge>
                </Box>
                
                <Divider />
                
                <Box width="100%">
                  <Heading size="sm" mb={2} color={theme.primary}>
                    <Flex align="center">
                      <Icon as={FaCalendarAlt} mr={2} />
                      Başvuru Tarihleri
                    </Flex>
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
                  <Heading size="sm" mb={2} color={theme.primary}>
                    <Flex align="center">
                      <Icon as={FaClipboardList} mr={2} />
                      Gerekli Belgeler
                    </Flex>
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
                      <Heading size="sm" mb={2} color={theme.primary}>
                        <Flex align="center">
                          <Icon as={FaClipboardCheck} mr={2} />
                          Değerlendirme Kriterleri
                        </Flex>
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
              <Button 
                bg={theme.primary}
                color="white"
                width="100%" 
                leftIcon={<FaPaperPlane />}
                onClick={handleLoginClick}
                _hover={{ bg: theme.info }}
                boxShadow="md"
                position="relative"
                overflow="hidden"
              >
                <Box 
                  position="absolute" 
                  left="0" 
                  top="0" 
                  h="100%" 
                  w="0" 
                  bg={`${theme.info}`}
                  transition="all 0.3s"
                  _groupHover={{ w: "100%" }}
                  opacity="0.3"
                />
                <Box position="relative" zIndex="1">
                  Giriş Yaparak Başvur
                </Box>
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default MainPage; 