import React, { useState } from 'react';
// Importações dos seus componentes
import LandingPage from './LandingPage';
import TranslatorPage from './TranslatorPage';
import NotFoundPage from './NotFoundPage';

function App() {
  const [currentPage, setCurrentPage] = useState('/');

  const navigateTo = (path) => {
    setCurrentPage(path);
  };

  const renderPage = () => {
    switch (currentPage) {
      case '/':
        return <LandingPage navigateTo={navigateTo} />;
      case '/tradutor':
        return <TranslatorPage navigateTo={navigateTo} />;
      default:
        return <NotFoundPage navigateTo={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-[#1f2937] font-inter antialiased">
      {renderPage()}
    </div>
  );
}

export default App;
