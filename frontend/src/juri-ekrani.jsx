import React from 'react';
import { Box, Heading, Text, Container } from '@chakra-ui/react';

const JuriEkrani = () => {
  return (
    <Container maxW="container.xl" py={10}>
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
        <Heading mb={4}>Jüri Ekranı</Heading>
        <Text>Jüri paneli yakında aktif olacaktır.</Text>
      </Box>
    </Container>
  );
};

export default JuriEkrani; 