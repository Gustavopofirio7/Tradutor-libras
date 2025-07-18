import React, { useState } from 'react';
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
    // O Tailwind CSS é carregado globalmente, geralmente no public/index.html
    // ou configurado via PostCSS/Webpack em projetos Create React App.
    // A classe 'font-inter antialiased' já sugere o uso de uma fonte moderna.
    <div className="min-h-screen bg-[#f0f4f8] text-[#1f2937] font-inter antialiased">
      {renderPage()}
    </div>
  );
}

export default App;