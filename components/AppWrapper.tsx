'use client';

import React, { useState } from 'react';
import Navbar from './Navbar';
import MainContent from './MainContent';
import GoogleSearchModal from './GoogleSearchModal';

export default function AppWrapper() {
  const [showGoogleSearch, setShowGoogleSearch] = useState(false);

  const handleGoogleSearch = () => {
    setShowGoogleSearch(true);
  };

  return (
    <>
      <Navbar onGoogleSearch={handleGoogleSearch} />
      <MainContent />
      
      {/* Google搜索模态框 */}
      <GoogleSearchModal
        isOpen={showGoogleSearch}
        onClose={() => setShowGoogleSearch(false)}
      />
    </>
  );
}