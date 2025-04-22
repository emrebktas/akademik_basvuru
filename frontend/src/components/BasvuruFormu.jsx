import React from 'react';
import DrOgrUyesiBasvuruForm from './DrOgrUyesiBasvuruForm';

const BasvuruFormu = ({ ilanID, kadroDurumu }) => {
  if (kadroDurumu === 'Dr. Öğr. Üyesi') {
    return <DrOgrUyesiBasvuruForm ilanID={ilanID} />;
  }
  // Diğer kadro durumları için farklı formlar...
  return null;
};

export default BasvuruFormu; 