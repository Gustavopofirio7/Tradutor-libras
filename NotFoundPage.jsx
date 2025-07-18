import React from 'react';

function NotFoundPage({ navigateTo }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4f8] p-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-[#3b82f6] mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-4">Página não encontrada</h2>
        <p className="text-lg mb-8">
          A página que você está procurando não existe ou foi movida.
        </p>
        <button
          onClick={() => navigateTo('/')}
          className="bg-[#3b82f6] text-white px-6 py-3 rounded-md font-medium hover:bg-[#2563eb] transition"
        >
          Voltar para a página inicial
        </button>
      </div>
    </div>
  );
}

export default NotFoundPage;