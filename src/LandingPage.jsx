import React from 'react';

function LandingPage({ navigateTo }) {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 p-4">
        <div className="container mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-[#3b82f6] rounded-md">Signa Web</h1>
          <button 
            onClick={() => navigateTo('/tradutor')}
            className="bg-[#3b82f6] text-white px-4 py-2 rounded-md hover:bg-[#2563eb] transition"
          >
            Experimentar
          </button>
        </div>
      </header>

      <section className="min-h-screen flex items-center justify-center text-center pt-20 pb-10 bg-[#f0f4f8] px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-[#1f2937] leading-tight mb-6 rounded-md">
            Signa Web: Conectando Mundos através da Libras
          </h2>
          <p className="text-xl sm:text-2xl text-[#6b7280] mb-10 leading-relaxed rounded-md">
            Transforme a Língua Brasileira de Sinais em texto e voz, promovendo inclusão e acessibilidade para todos.
          </p>
          <button
            onClick={() => navigateTo('/tradutor')}
            className="inline-block bg-[#3b82f6] text-white font-bold py-4 px-10 rounded-full text-xl sm:text-2xl transition-all duration-300 hover:bg-[#1d4ed8] focus:outline-none focus:ring-4 focus:ring-[#3b82f6] focus:ring-opacity-50 shadow-lg"
          >
            Iniciar Teste
          </button>
        </div>
      </section>

      <section className="py-16 bg-white shadow-md rounded-lg mx-4 sm:mx-8 lg:mx-16 my-10 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center">
          <h3 className="text-4xl font-bold text-[#1f2937] mb-12 rounded-md">Como Funciona?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Passo 1: Webcam */}
            <div className="flex flex-col items-center p-6 bg-[#f0f4f8] rounded-xl shadow-md">
              <svg className="w-16 h-16 text-[#3b82f6] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14m-5 4v-4m0 0l-4-4m4 4V6m0 0l4 4m-4-4l-4 4"/>
              </svg>
              <h4 className="text-xl font-bold mb-2">1. Ative sua Webcam</h4>
              <p className="text-center">Permita o acesso à câmera para começar a tradução</p>
            </div>

            {/* Passo 2: Faça os sinais */}
            <div className="flex flex-col items-center p-6 bg-[#f0f4f8] rounded-xl shadow-md">
              <svg className="w-16 h-16 text-[#3b82f6] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/>
              </svg>
              <h4 className="text-xl font-bold mb-2">2. Faça os Sinais</h4>
              <p className="text-center">Nosso sistema reconhece os gestos em tempo real</p>
            </div>

            {/* Passo 3: Tradução automática */}
            <div className="flex flex-col items-center p-6 bg-[#f0f4f8] rounded-xl shadow-md">
              <svg className="w-16 h-16 text-[#3b82f6] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
              </svg>
              <h4 className="text-xl font-bold mb-2">3. Tradução Automática</h4>
              <p className="text-center">Seus gestos são convertidos para texto instantaneamente</p>
            </div>

            {/* Passo 4: Voz ou texto */}
            <div className="flex flex-col items-center p-6 bg-[#f0f4f8] rounded-xl shadow-md">
              <svg className="w-16 h-16 text-[#3b82f6] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
              </svg>
              <h4 className="text-xl font-bold mb-2">4. Saída em Voz/Texto</h4>
              <p className="text-center">Escolha entre ouvir a tradução ou ler na tela</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#1f2937] text-white py-8">
        <div className="container mx-auto text-center">
          <p>© {new Date().getFullYear()} Signa Web - Todos os direitos reservados</p>
          <p className="mt-2">Promovendo inclusão e acessibilidade através da tecnologia</p>
        </div>
      </footer>
    </>
  );
}

export default LandingPage; // <--- ESTA LINHA É CRUCIAL
