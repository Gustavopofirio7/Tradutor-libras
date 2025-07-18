import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
// Importa os ícones do Feather Icons
import { FiCamera, FiHand, FiType, FiVolume2, FiArrowRight, FiAward, FiClock, FiUser } from 'react-icons/fi';

// Componente de Card Animado para as funcionalidades/diferenciais
const FeatureCard = ({ icon, title, description, color }) => {
  const controls = useAnimation();
  // useInView para animar o card quando ele entra na viewport
  const [ref, inView] = useInView({
    threshold: 0.1, // Começa a animar quando 10% do card está visível
    triggerOnce: true // Anima apenas uma vez
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    } else {
      // Opcional: controls.start("hidden"); para reverter a animação ao sair da view
    }
  }, [controls, inView]);

  const variants = {
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    },
    hidden: { 
      opacity: 0, 
      y: 30 
    }
  };

  // Mapeamento de cores para gradientes de fundo dos cards
  const bgColors = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
    pink: 'from-pink-500 to-pink-600'
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={variants}
      whileHover={{ scale: 1.03 }} // Efeito de zoom no hover
      className={`bg-gradient-to-br ${bgColors[color]} p-0.5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300`}
    >
      <div className="bg-white rounded-xl p-8 h-full">
        <div className={`w-16 h-16 bg-${color}-100 rounded-xl flex items-center justify-center mb-6`}>
          {React.cloneElement(icon, { className: `text-${color}-600 text-3xl` })} {/* Clona o ícone para aplicar cor e tamanho dinamicamente */}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
};

function LandingPage({ navigateTo }) {
  // Controles de animação para seções principais (Hero)
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.1, // Anima quando 10% da seção está visível
    triggerOnce: true // Anima apenas uma vez
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    } else {
      controls.start("hidden");
    }
  }, [controls, inView]);

  // Variantes de animação para o container e itens do Hero
  const containerVariants = {
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Atraso entre a animação dos filhos
        delayChildren: 0.3 // Atraso para o início da animação dos filhos
      }
    },
    hidden: { opacity: 0 }
  };

  const itemVariants = {
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.6, -0.05, 0.01, 0.99] // Curva de easing personalizada
      }
    },
    hidden: { y: 50, opacity: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-x-hidden">
      {/* Header Flutuante e Animado */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          type: "spring", // Animação tipo mola
          damping: 20, // Amortecimento
          stiffness: 100 // Rigidez
        }}
        className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 py-4 px-6 sm:px-8 lg:px-12 shadow-sm"
      >
        <div className="container mx-auto flex justify-between items-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <FiHand className="text-white text-xl" /> {/* Ícone da mão */}
            </div>
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              SignaWeb
            </h1>
          </motion.div>
          
          <motion.button 
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)" // Sombra no hover
            }}
            whileTap={{ scale: 0.95 }} // Efeito de clique
            onClick={() => navigateTo('/tradutor')}
            className="relative overflow-hidden px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold group"
          >
            <span className="relative z-10 flex items-center">
              Experimentar <FiArrowRight className="ml-2 transition-transform group-hover:translate-x-1" /> {/* Ícone de seta */}
            </span>
            {/* Efeito de brilho no botão */}
            <motion.span 
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 400, opacity: 0.4 }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "linear"
              }}
              className="absolute top-0 left-0 w-20 h-full bg-white/30 skew-x-12"
            />
          </motion.button>
        </div>
      </motion.header>

      {/* Seção Hero/Introdução com Efeitos Visuais e Animações */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-4 sm:px-8 lg:px-16 overflow-hidden">
        {/* Elementos decorativos animados de fundo (bolhas de cor) */}
        <motion.div 
          animate={{
            x: [0, 20, 0],
            y: [0, 30, 0],
            rotate: [0, 5, 0]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
        
        <motion.div 
          animate={{
            x: [0, -30, 0],
            y: [0, 40, 0],
            rotate: [0, -8, 0]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-1/3 right-1/4 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />
        
        <motion.div 
          animate={{
            x: [0, 25, 0],
            y: [0, -30, 0],
            rotate: [0, 3, 0]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
        />

        {/* Conteúdo principal do Hero com animações de entrada */}
        <motion.div 
          ref={ref}
          initial="hidden"
          animate={controls}
          variants={containerVariants}
          className="relative max-w-6xl mx-auto text-center z-10"
        >
          <motion.div variants={itemVariants} className="mb-8">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold shadow-sm">
              NOVA VERSÃO DISPONÍVEL
            </span>
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight mb-8">
            Revolucionando a <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">comunicação</span> em Libras
          </motion.h1>
          
          <motion.p variants={itemVariants} className="text-xl sm:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
            A plataforma mais avançada para tradução de Língua Brasileira de Sinais, combinando inteligência artificial com tecnologia acessível.
          </motion.p>
          
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.button
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)" 
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigateTo('/tradutor')}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Comece Agora - É Grátis
            </motion.button>
            <motion.button
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" 
              }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-white text-gray-700 font-bold rounded-xl text-lg border-2 border-gray-200 hover:border-blue-400 transition-all duration-300"
            >
              Demonstração
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* Seção de Diferenciais (Por que escolher?) */}
      <section className="py-20 px-4 sm:px-8 lg:px-16 bg-white">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, margin: "-100px" }} // Anima quando entra na view, uma vez
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Por que escolher o SignaWeb?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tecnologia de ponta projetada para tornar a comunicação acessível a todos.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FiAward />} // Ícone de prêmio
              title="Precisão Avançada"
              description="Taxa de acerto superior a 95% nos sinais mais comuns com nosso algoritmo exclusivo."
              color="blue"
            />
            <FeatureCard
              icon={<FiClock />} // Ícone de relógio
              title="Tempo Real"
              description="Tradução instantânea com delay inferior a 0.3 segundos para conversas fluidas."
              color="purple"
            />
            <FeatureCard
              icon={<FiUser />} // Ícone de usuário
              title="Acessível"
              description="Funciona em qualquer dispositivo sem necessidade de hardware especializado."
              color="indigo"
            />
          </div>
        </div>
      </section>

      {/* Seção de Funcionalidades Detalhadas */}
      <section className="py-20 px-4 sm:px-8 lg:px-16 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">
              TECNOLOGIA
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Como transformamos gestos em voz
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nosso sistema avançado combina visão computacional com deep learning para resultados precisos.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<FiCamera />} // Ícone de câmera
              title="Captura Inteligente"
              description="Sistema adaptativo que funciona em diversas condições de iluminação e ângulos."
              color="blue"
            />
            <FeatureCard
              icon={<FiHand />} // Ícone de mão
              title="Reconhecimento 3D"
              description="Detecção tridimensional dos gestos para maior precisão na interpretação."
              color="purple"
            />
            <FeatureCard
              icon={<FiType />} // Ícone de texto
              title="Processamento Neural"
              description="Redes neurais profundas treinadas especificamente para Libras brasileira."
              color="indigo"
            />
            <FeatureCard
              icon={<FiVolume2 />} // Ícone de volume
              title="Voz Natural"
              description="Síntese de voz com entonação natural e ritmo conversacional."
              color="pink"
            />
          </div>
        </div>
      </section>

      {/* Rodapé Aprimorado */}
      <footer className="bg-gray-900 text-white pt-20 pb-10 px-4 sm:px-8 lg:px-16">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <FiHand className="text-white text-xl" />
                </div>
                <h3 className="text-2xl font-bold text-white">SignaWeb</h3>
              </div>
              <p className="text-gray-400 mb-6">
                Tornando a comunicação acessível através de tecnologia inovadora.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">Produto</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Planos</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">Suporte</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentação</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Tutoriais</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-6">Legal</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Termos</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} SignaWeb. Todos os direitos reservados.
            </p>
            {/* Adicione links de redes sociais aqui se desejar */}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
