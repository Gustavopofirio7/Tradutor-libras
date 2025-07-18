import React, { useState, useRef, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import { drawHand } from './utilities.js'; // Função auxiliar para visualização

function TranslatorPage({ navigateTo }) {
    // Estados
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [translatedText, setTranslatedText] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [modelLoading, setModelLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [detectionActive, setDetectionActive] = useState(true);
    const [history, setHistory] = useState([]);

    // Referências
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const modelRef = useRef(null);
    const canvasRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastDetectionTimeRef = useRef(0);

    // Carrega o modelo Handpose
    useEffect(() => {
        const loadModel = async () => {
            try {
                setModelLoading(true);

                // Define o backend WebGL para melhor performance
                await tf.setBackend('webgl').then(() => {
                    console.log('Backend WebGL carregado');
                });

                // Carrega o modelo Handpose com feedback de progresso
                const model = await handpose.load({
                    // Callback para monitorar o progresso do carregamento
                    onProgress: (fraction) => {
                        setLoadingProgress(Math.min(Math.round(fraction * 100), 99));
                    }
                });

                modelRef.current = model;
                setLoadingProgress(100); // Garante 100% ao finalizar
                setTimeout(() => setModelLoading(false), 500); // Pequeno delay para a transição visual

            } catch (err) {
                console.error("Erro ao carregar modelo:", err);
                setTranslatedText("Erro ao carregar o modelo. Recarregue a página.");
                setModelLoading(false);
            }
        };

        loadModel();

        // Limpeza ao desmontar o componente
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // Controle da câmera
    const toggleCamera = async () => {
        if (isCameraOn) {
            stopCamera();
        } else {
            await startCamera();
        }
    };

    const startCamera = async () => {
        try {
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user' // Usa a câmera frontal
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            setIsCameraOn(true);

            // Ajusta o tamanho do canvas para corresponder ao vídeo
            videoRef.current.onloadedmetadata = () => {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                // Inicia detecção quando ambos modelo e câmera estiverem prontos
                if (modelRef.current) {
                    startDetection();
                }
            };

        } catch (err) {
            console.error("Erro na câmera:", err);
            setTranslatedText("Permissão da câmera negada. Por favor, habilite o acesso.");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsCameraOn(false);
        stopDetection();
        setTranslatedText("");
    };

    // Controle de detecção
    const startDetection = () => {
        // Garante que o loop só comece se a detecção estiver ativa, câmera ligada e modelo carregado
        if (!detectionActive || !isCameraOn || !modelRef.current || !videoRef.current || !videoRef.current.srcObject) {
            return;
        }

        const detect = async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
                const predictions = await modelRef.current.estimateHands(videoRef.current);
                drawResults(predictions); // Desenha os pontos no canvas

                // Limite de taxa de detecção para otimização (aprox. 10fps)
                const now = Date.now();
                if (now - lastDetectionTimeRef.current > 100) {
                    lastDetectionTimeRef.current = now;
                    processPredictions(predictions); // Processa as predições para reconhecimento de sinais
                }
            }
            animationFrameRef.current = requestAnimationFrame(detect); // Continua o loop
        };

        detect(); // Inicia a primeira iteração do loop
    };

    const stopDetection = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Limpa o canvas
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    // Efeito para iniciar/parar a detecção quando o estado `detectionActive` muda
    useEffect(() => {
        if (detectionActive && isCameraOn && modelRef.current) {
            startDetection();
        } else {
            stopDetection();
        }
    }, [detectionActive, isCameraOn, modelRef.current]);

    // Processa as predições e tenta reconhecer um sinal
    const processPredictions = (predictions) => {
        if (predictions.length > 0) {
            const landmarks = predictions[0].landmarks; // Pega os landmarks da primeira mão detectada

            // Tenta reconhecer o sinal
            const recognizedSign = recognizeSign(landmarks);

            if (recognizedSign) {
                setTranslatedText(recognizedSign);
                addToHistory(recognizedSign);
            } else {
                setTranslatedText("Sinal não reconhecido. Tente outro.");
            }
        } else {
            setTranslatedText("Posicione suas mãos no campo da câmera...");
        }
    };

    // Função auxiliar para calcular a distância euclidiana entre dois pontos
    const calculateDistance = (point1, point2) => {
        return Math.hypot(point1[0] - point2[0], point1[1] - point2[1]);
    };

    // Função de reconhecimento de sinais (Lógica expandida baseada em regras)
    const recognizeSign = (landmarks) => {
        // Os landmarks são um array de 21 pontos [x, y, z]
        // Cada ponto corresponde a uma parte específica da mão:
        // 0: Pulso
        // 1-4: Polegar (base ao topo)
        // 5-8: Indicador (base ao topo)
        // 9-12: Dedo médio (base ao topo)
        // 13-16: Dedo anelar (base ao topo)
        // 17-20: Dedo mínimo (base ao topo)

        // Pontos de interesse comuns:
        const wrist = landmarks[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];

        const thumbBase = landmarks[1];
        const indexBase = landmarks[5];
        const middleBase = landmarks[9];
        const ringBase = landmarks[13];
        const pinkyBase = landmarks[17];

        // --- Sinais de Exemplo ---

        // Sinal "A" (Mão fechada com polegar cruzado)
        // O polegar está próximo à base do indicador/meio e os outros dedos estão curvados.
        const distThumbToIndexBase = calculateDistance(thumbTip, indexBase);
        const distIndexTipToMiddleTip = calculateDistance(indexTip, middleTip);
        const distMiddleTipToRingTip = calculateDistance(middleTip, ringTip);
        const distRingTipToPinkyTip = calculateDistance(ringTip, pinkyTip);

        // Condições para "A": Polegar próximo à base do indicador, e os outros dedos estão próximos entre si (curvados/fechados)
        if (distThumbToIndexBase < 50 && // Polegar próximo à base do indicador
            distIndexTipToMiddleTip < 40 &&
            distMiddleTipToRingTip < 40 &&
            distRingTipToPinkyTip < 40) {
            return "A";
        }

        // Sinal "L" (Indicador e polegar estendidos, outros dedos fechados)
        // O polegar e o indicador estão distantes um do outro e da palma, enquanto os outros dedos estão curvados e próximos.
        const distThumbToIndexTip = calculateDistance(thumbTip, indexTip);
        const distMiddleTipToPalm = calculateDistance(middleTip, middleBase); // Distância da ponta à base do dedo médio
        const distRingTipToPalm = calculateDistance(ringTip, ringBase);
        const distPinkyTipToPalm = calculateDistance(pinkyTip, pinkyBase);

        // Condições para "L": Polegar e indicador abertos, e os outros dedos estão curvados (próximos à palma)
        if (distThumbToIndexTip > 100 && // Polegar e indicador bem abertos
            distMiddleTipToPalm < 70 && // Dedo médio curvado
            distRingTipToPalm < 70 &&   // Dedo anelar curvado
            distPinkyTipToPalm < 70) {  // Dedo mínimo curvado
            return "L";
        }

        // Sinal "B" (Mão aberta, dedos juntos e estendidos)
        // As pontas dos dedos (exceto polegar) estão alinhadas e distantes da palma, e próximas entre si.
        const distIndexTipToPalm = calculateDistance(indexTip, indexBase);
        const distMiddleTipToPalmB = calculateDistance(middleTip, middleBase);
        const distRingTipToPalmB = calculateDistance(ringTip, ringBase);
        const distPinkyTipToPalmB = calculateDistance(pinkyTip, pinkyBase);

        // Condições para "B": Todos os dedos (exceto polegar) estendidos e próximos
        if (distIndexTipToPalm > 100 && // Indicador estendido
            distMiddleTipToPalmB > 100 && // Médio estendido
            distRingTipToPalmB > 100 &&   // Anelar estendido
            distPinkyTipToPalmB > 100 &&  // Mínimo estendido
            distIndexTipToMiddleTip < 40 && // Dedos próximos
            distMiddleTipToRingTip < 40 &&
            distRingTipToPinkyTip < 40) {
            return "B";
        }

        // Sinal "C" (Mão em forma de C)
        // Todos os dedos estão curvados, mas não completamente fechados, formando um "C".
        // As pontas dos dedos estão a uma distância intermediária da palma.
        const distIndexTipFromPalm = calculateDistance(indexTip, indexBase);
        const distMiddleTipFromPalm = calculateDistance(middleTip, middleBase);
        const distRingTipFromPalm = calculateDistance(ringTip, ringBase);
        const distPinkyTipFromPalm = calculateDistance(pinkyTip, pinkyBase);

        // Condições para "C": Dedos curvados (distância intermediária da palma)
        if (distIndexTipFromPalm > 40 && distIndexTipFromPalm < 90 &&
            distMiddleTipFromPalm > 40 && distMiddleTipFromPalm < 90 &&
            distRingTipFromPalm > 40 && distRingTipFromPalm < 90 &&
            distPinkyTipFromPalm > 40 && distPinkyTipFromPalm < 90) {
            return "C";
        }


        // Sinal "O" (Mão em forma de O, polegar e indicador se tocam ou estão muito próximos)
        // A ponta do polegar está muito próxima da ponta de um dos outros dedos (geralmente indicador ou médio).
        const distThumbToIndexTipO = calculateDistance(thumbTip, indexTip);
        const distThumbToMiddleTipO = calculateDistance(thumbTip, middleTip);

        // Condições para "O": Polegar e indicador/médio muito próximos
        if (distThumbToIndexTipO < 30 || distThumbToMiddleTipO < 30) {
            return "O";
        }

        // Se nenhum sinal for reconhecido, retorna null
        return null;
    };

    // Desenha os resultados no canvas
    const drawResults = (predictions) => {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        if (predictions.length > 0) {
            // Desenha a primeira mão detectada
            drawHand(predictions[0].landmarks, ctx);
        }
    };

    // Histórico de traduções
    const addToHistory = (text) => {
        // Adiciona ao histórico apenas se o texto for diferente do último
        if (!text || (history.length > 0 && history[0].text === text)) return;

        setHistory(prev => [
            { text, timestamp: new Date().toLocaleTimeString() },
            ...prev.slice(0, 9) // Mantém apenas os 10 itens mais recentes
        ]);
    };

    // Síntese de voz
    const speakText = () => {
        if (!translatedText) return;

        if ('speechSynthesis' in window) {
            speechSynthesis.cancel(); // Cancela qualquer fala anterior
            const utterance = new SpeechSynthesisUtterance(translatedText);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.9; // Velocidade da fala

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);

            speechSynthesis.speak(utterance);
        }
    };

    // Limpeza ao desmontar o componente
    useEffect(() => {
        return () => {
            stopCamera(); // Garante que a câmera seja desligada
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel(); // Cancela qualquer fala em andamento
            }
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 font-inter antialiased">
            {/* Cabeçalho */}
            <header className="bg-white shadow-sm py-4 px-6">
                <div className="container mx-auto flex justify-between items-center">
                    <button
                        onClick={() => navigateTo('/')}
                        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Voltar
                    </button>

                    <h1 className="text-2xl font-bold text-blue-600">
                        Tradutor de Libras
                    </h1>

                    <div className="w-8"></div> {/* Espaçador para centralizar o título */}
                </div>
            </header>

            {/* Conteúdo principal */}
            <main className="container mx-auto py-8 px-4">
                {/* Seção de status e controles */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-4 text-gray-700">
                        <span className={`inline-block w-3 h-3 rounded-full ${isCameraOn ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        <span>{isCameraOn ? 'Câmera ativa' : 'Câmera inativa'}</span>
                    </div>

                    <div className="flex space-x-4">
                        <button
                            onClick={toggleCamera}
                            disabled={modelLoading}
                            className={`px-4 py-2 rounded-md flex items-center justify-center transition-all duration-200
                                ${isCameraOn ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}
                                ${modelLoading ? 'opacity-50 cursor-not-allowed' : 'shadow-md hover:shadow-lg'} text-white`}
                        >
                            {modelLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Carregando ({loadingProgress}%)
                                </>
                            ) : isCameraOn ? 'Desligar Câmera' : 'Ligar Câmera'}
                        </button>

                        <button
                            onClick={() => setDetectionActive(!detectionActive)}
                            disabled={!isCameraOn || modelLoading}
                            className={`px-4 py-2 rounded-md transition-all duration-200
                                ${detectionActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-500 hover:bg-gray-600'}
                                ${!isCameraOn || modelLoading ? 'opacity-50 cursor-not-allowed' : 'shadow-md hover:shadow-lg'} text-white`}
                        >
                            {detectionActive ? 'Pausar Detecção' : 'Retomar Detecção'}
                        </button>
                    </div>
                </div>

                {/* Área de visualização */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Visualização da câmera */}
                    <div className="bg-white rounded-lg shadow-md overflow-hidden relative">
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}> {/* Proporção 16:9 */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="absolute inset-0 w-full h-full object-cover bg-black rounded-md"
                            />
                            <canvas
                                ref={canvasRef}
                                className="absolute inset-0 w-full h-full pointer-events-none rounded-md"
                            />
                            {!isCameraOn && (
                                <div className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-70 rounded-md">
                                    <div className="text-center">
                                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <p className="text-lg">Câmera desativada</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Área de tradução */}
                    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Tradução</h2>

                        <div className="flex-grow bg-gray-100 rounded-lg p-4 mb-4 flex items-center justify-center min-h-48">
                            {translatedText ? (
                                <p className="text-2xl font-medium text-gray-800 text-center select-all">{translatedText}</p>
                            ) : (
                                <p className="text-gray-500 text-center">A tradução aparecerá aqui quando você fizer os sinais na câmera.</p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={speakText}
                                disabled={!translatedText || isSpeaking}
                                className={`flex-1 flex items-center justify-center py-3 rounded-md transition-all duration-200
                                    ${translatedText && !isSpeaking ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'} text-white shadow-md hover:shadow-lg`}
                            >
                                {isSpeaking ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Lendo...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                        Ouvir
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => setTranslatedText('')}
                                disabled={!translatedText}
                                className={`px-4 py-3 rounded-md transition-all duration-200
                                    ${translatedText ? 'bg-gray-500 hover:bg-gray-600' : 'bg-gray-300 cursor-not-allowed'} text-white shadow-md hover:shadow-lg`}
                            >
                                Limpar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Histórico e dicas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Histórico de traduções */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Histórico</h2>
                        {history.length > 0 ? (
                            <ul className="space-y-2 max-h-60 overflow-y-auto">
                                {history.map((item, index) => (
                                    <li key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                        <span className="font-medium text-gray-700">{item.text}</span>
                                        <span className="text-sm text-gray-500">{item.timestamp}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">Nenhuma tradução recente.</p>
                        )}
                    </div>

                    {/* Dicas */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">Dicas para Melhor Reconhecimento</h2>
                        <ul className="space-y-3 text-gray-700">
                            <li className="flex items-start">
                                <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Use boa iluminação e um fundo claro e uniforme para melhor contraste.</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Mantenha as mãos dentro da área demarcada pela câmera.</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Faça os sinais de forma clara, com movimentos definidos e pausados.</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Evite movimentos muito rápidos ou que fiquem fora do campo de visão.</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>O sistema funciona melhor com uma mão de cada vez.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default TranslatorPage; // <--- ESTA LINHA É CRUCIAL

