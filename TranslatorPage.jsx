import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import { drawHand } from './utilities.js';
import { motion } from 'framer-motion';
import { FiCameraOff, FiCamera, FiPlay, FiVolume2, FiTrash2, FiArrowLeft, FiLoader, FiPauseCircle, FiPlayCircle } from 'react-icons/fi';

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
    const videoContainerRef = useRef(null); // Nova referência para o contêiner do vídeo

    // Carregamento do Modelo Handpose
    useEffect(() => {
        let isMounted = true; // Flag para verificar se o componente está montado

        const loadModel = async () => {
            try {
                if (isMounted) {
                    setModelLoading(true);
                    setLoadingProgress(0); // Reinicia o progresso
                }

                await tf.setBackend('webgl');
                console.log('Backend WebGL carregado');

                const model = await handpose.load({
                    onProgress: (fraction) => {
                        if (isMounted) {
                            setLoadingProgress(Math.min(Math.round(fraction * 100), 99));
                        }
                    }
                });

                if (isMounted) {
                    modelRef.current = model;
                    setLoadingProgress(100);
                    setTimeout(() => setModelLoading(false), 500);
                }
            } catch (err) {
                console.error("Erro ao carregar modelo:", err);
                if (isMounted) {
                    setTranslatedText("Erro ao carregar o modelo. Recarregue a página.");
                    setModelLoading(false);
                }
            }
        };

        loadModel();

        // Cleanup: Define isMounted como false quando o componente é desmontado
        return () => {
            isMounted = false;
            // Garante que qualquer animação de carregamento seja cancelada
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // Funções de Controle da Câmera
    const stopCamera = useCallback(() => {
        // Prioridade: liberar srcObject e parar trilhas do stream
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject = null; // Libera o stream do elemento de vídeo
        }
        if (streamRef.current && typeof streamRef.current.getTracks === 'function') {
            streamRef.current.getTracks().forEach(track => {
                if (track.readyState === 'live') { // Verifica se a trilha está ativa antes de parar
                    track.stop();
                }
            });
            streamRef.current = null; // Limpa a referência do stream
        }
        
        setIsCameraOn(false);
        stopDetection(); // Garante que o loop de detecção seja parado
        setTranslatedText("");
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }
    }, [stopDetection]);

    const startCamera = useCallback(async () => {
        // Primeiro, garanta que qualquer câmera anterior esteja completamente parada
        await stopCamera();

        try {
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                }
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;

                // Retorna uma Promise que resolve quando o vídeo estiver pronto
                return new Promise((resolve) => {
                    videoRef.current.onloadedmetadata = () => {
                        if (canvasRef.current && videoRef.current) {
                            canvasRef.current.width = videoRef.current.videoWidth;
                            canvasRef.current.height = videoRef.current.videoHeight;
                        }
                        setIsCameraOn(true);
                        resolve(); // Resolve a promise quando o vídeo está pronto
                    };
                });
            }
        } catch (err) {
            console.error("Erro ao acessar a câmera:", err);
            setTranslatedText("Permissão da câmera negada ou câmera não encontrada. Habilite o acesso ou verifique se há uma câmera conectada.");
            setIsCameraOn(false);
            // Garante que o stream seja parado mesmo em caso de erro
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        }
    }, [stopCamera]); // stopCamera é uma dependência porque é chamada aqui

    const toggleCamera = useCallback(async () => {
        if (isCameraOn) {
            await stopCamera();
        } else {
            await startCamera();
        }
    }, [isCameraOn, startCamera, stopCamera]);

    // Controle de Detecção
    const stopDetection = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        // Não limpa o canvas aqui, pois stopCamera já faz isso
    }, []);

    const startDetection = useCallback(() => {
        if (!detectionActive || !isCameraOn || !modelRef.current || !videoRef.current || videoRef.current.readyState !== 4) {
            return;
        }

        // Garante que qualquer loop anterior seja parado antes de iniciar um novo
        stopDetection();

        const detect = async () => {
            if (!videoRef.current || videoRef.current.readyState !== 4 || !modelRef.current || !detectionActive || !isCameraOn) {
                return; // Condições de saída do loop
            }

            try {
                const predictions = await modelRef.current.estimateHands(videoRef.current);

                if (canvasRef.current) {
                    const ctx = canvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        if (predictions.length > 0) {
                            drawHand(predictions[0].landmarks, ctx);
                        }
                    }
                }

                const now = Date.now();
                if (now - lastDetectionTimeRef.current > 100) { // ~10 FPS
                    lastDetectionTimeRef.current = now;
                    processPredictions(predictions);
                }
            } catch (err) {
                console.error("Erro durante detecção:", err);
                // Se houver um erro grave na detecção, pare o loop para evitar spam
                stopDetection();
            }

            animationFrameRef.current = requestAnimationFrame(detect);
        };

        animationFrameRef.current = requestAnimationFrame(detect);
    }, [detectionActive, isCameraOn, modelRef, videoRef, processPredictions, stopDetection, drawResults]);


    // Efeito para gerenciar o loop de detecção baseado nos estados
    useEffect(() => {
        if (isCameraOn && modelRef.current && detectionActive) {
            // Pequeno delay para garantir que o videoRef.current esteja pronto após isCameraOn = true
            const timeoutId = setTimeout(() => {
                if (videoRef.current && videoRef.current.readyState === 4) {
                    startDetection();
                }
            }, 100);
            return () => clearTimeout(timeoutId);
        } else {
            stopDetection();
        }
        // Cleanup para o efeito: garante que a detecção pare se os estados mudarem ou componente desmontar
        return () => stopDetection();
    }, [isCameraOn, modelRef.current, detectionActive, startDetection, stopDetection, videoRef]);


    // Lógica de Reconhecimento de Sinais
    const calculateDistance = useCallback((point1, point2) => {
        return Math.hypot(point1[0] - point2[0], point1[1] - point2[1]);
    }, []);

    const recognizeSign = useCallback((landmarks) => {
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

        const distThumbToIndexBase = calculateDistance(thumbTip, indexBase);
        const distIndexTipToMiddleTip = calculateDistance(indexTip, middleTip);
        const distMiddleTipToRingTip = calculateDistance(middleTip, ringTip);
        const distRingTipToPinkyTip = calculateDistance(ringTip, pinkyTip);

        if (distThumbToIndexBase < 50 && distIndexTipToMiddleTip < 40 &&
            distMiddleTipToRingTip < 40 && distRingTipToPinkyTip < 40) {
            return "A";
        }

        const distThumbToIndexTip = calculateDistance(thumbTip, indexTip);
        const distMiddleTipToPalm = calculateDistance(middleTip, middleBase);
        const distRingTipToPalm = calculateEstimateDistance(ringTip, ringBase); // Corrigido para calculateDistance
        const distPinkyTipToPalm = calculateDistance(pinkyTip, pinkyBase);

        if (distThumbToIndexTip > 100 && distMiddleTipToPalm < 70 &&
            distRingTipToPalm < 70 && distPinkyTipToPalm < 70) {
            return "L";
        }

        const distIndexTipToPalm = calculateDistance(indexTip, indexBase);
        const distMiddleTipToPalmB = calculateDistance(middleTip, middleBase);
        const distRingTipToPalmB = calculateDistance(ringTip, ringBase);
        const distPinkyTipToPalmB = calculateDistance(pinkyTip, pinkyBase);

        if (distIndexTipToPalm > 100 && distMiddleTipToPalmB > 100 &&
            distRingTipToPalmB > 100 && distPinkyTipToPalmB > 100 &&
            distIndexTipToMiddleTip < 40 && distMiddleTipToRingTip < 40 &&
            distRingTipToPinkyTip < 40) {
            return "B";
        }

        const distIndexTipFromPalm = calculateDistance(indexTip, indexBase);
        const distMiddleTipFromPalm = calculateDistance(middleTip, middleBase);
        const distRingTipFromPalm = calculateDistance(ringTip, ringBase);
        const distPinkyTipFromPalm = calculateDistance(pinkyTip, pinkyBase);

        if (distIndexTipFromPalm > 40 && distIndexTipFromPalm < 90 &&
            distMiddleTipFromPalm > 40 && distMiddleTipFromPalm < 90 &&
            distRingTipFromPalm > 40 && distRingTipFromPalm < 90 &&
            distPinkyTipFromPalm > 40 && distPinkyTipFromPalm < 90) {
            return "C";
        }

        const distThumbToIndexTipO = calculateDistance(thumbTip, indexTip);
        const distThumbToMiddleTipO = calculateDistance(thumbTip, middleTip);

        if (distThumbToIndexTipO < 30 || distThumbToMiddleTipO < 30) {
            return "O";
        }

        return null;
    }, [calculateDistance]);

    const processPredictions = useCallback((predictions) => {
        if (predictions.length > 0) {
            const landmarks = predictions[0].landmarks;
            const recognizedSign = recognizeSign(landmarks);

            if (recognizedSign) {
                setTranslatedText(recognizedSign);
                addToHistory(recognizedSign);
            } else {
                setTranslatedText(prev => prev !== "Sinal não reconhecido. Tente outro."
                    ? "Sinal não reconhecido. Tente outro."
                    : prev);
            }
        } else {
            setTranslatedText(prev => prev !== "Posicione suas mãos no campo da câmera..."
                ? "Posicione suas mãos no campo da câmera..."
                : prev);
        }
    }, [recognizeSign, addToHistory]);

    const drawResults = useCallback((predictions) => {
        if (!canvasRef.current || !videoRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);

        if (predictions.length > 0) {
            drawHand(predictions[0].landmarks, ctx);
        }
    }, []);

    const addToHistory = useCallback((text) => {
        if (!text) return;

        setHistory(prev => {
            if (prev.length > 0 && prev[0].text === text) {
                return prev;
            }
            return [
                { text, timestamp: new Date().toLocaleTimeString() },
                ...prev.slice(0, 9)
            ];
        });
    }, []);

    const speakText = useCallback(() => {
        if (!translatedText || !('speechSynthesis' in window)) return;

        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(translatedText);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.9;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false); // Adicionado tratamento de erro para fala

        speechSynthesis.speak(utterance);
    }, [translatedText]);

    // Cleanup final ao desmontar o componente
    useEffect(() => {
        return () => {
            stopCamera(); // Garante que a câmera seja desligada
            stopDetection(); // Garante que o loop de detecção seja parado
            if ('speechSynthesis' in window) {
                speechSynthesis.cancel();
            }
        };
    }, [stopCamera, stopDetection]);


    return (
        <div className="min-h-screen bg-gray-100 font-inter antialiased text-gray-800">
            {/* Header aprimorado */}
            <motion.header 
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 100 }}
                className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 py-4 px-6 shadow-sm"
            >
                <div className="container mx-auto flex justify-between items-center">
                    <button
                        onClick={() => {
                            stopCamera(); // Garante que a câmera seja desligada ao sair
                            navigateTo('/');
                        }}
                        className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 text-lg font-medium"
                    >
                        <FiArrowLeft className="mr-2 text-xl" />
                        Voltar
                    </button>

                    <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        Tradutor de Libras
                    </h1>

                    <div className="w-24"></div> {/* Espaçador */}
                </div>
            </motion.header>

            {/* Main Content Area */}
            <main className="container mx-auto py-28 px-4 sm:px-6 lg:px-8">
                {/* Status e Controles */}
                <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-white rounded-xl shadow-md">
                    <div className="flex items-center space-x-3 text-lg font-semibold">
                        <span className={`inline-block w-4 h-4 rounded-full ${isCameraOn ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                        <span className={isCameraOn ? 'text-green-700' : 'text-red-700'}>
                            {isCameraOn ? 'Câmera Ativa' : 'Câmera Inativa'}
                        </span>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={toggleCamera}
                            disabled={modelLoading}
                            className={`px-6 py-3 rounded-full flex items-center justify-center font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg
                                ${modelLoading ? 'bg-gray-400 cursor-not-allowed' : (isCameraOn ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700')}`}
                        >
                            {modelLoading ? (
                                <>
                                    <FiLoader className="animate-spin mr-2 text-xl" /> Carregando Modelo ({loadingProgress}%)
                                </>
                            ) : isCameraOn ? (
                                <>
                                    <FiCameraOff className="mr-2 text-xl" /> Desligar Câmera
                                </>
                            ) : (
                                <>
                                    <FiCamera className="mr-2 text-xl" /> Ligar Câmera
                                </>
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setDetectionActive(!detectionActive)}
                            disabled={!isCameraOn || modelLoading}
                            className={`px-6 py-3 rounded-full flex items-center justify-center font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg
                                ${!isCameraOn || modelLoading ? 'bg-gray-400 cursor-not-allowed' : (detectionActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-500 hover:bg-gray-600')}`}
                        >
                            {detectionActive ? (
                                <>
                                    <FiPauseCircle className="mr-2 text-xl" /> Pausar Detecção
                                </>
                            ) : (
                                <>
                                    <FiPlayCircle className="mr-2 text-xl" /> Retomar Detecção
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>

                {/* Área de Visualização e Tradução */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden relative border border-gray-200">
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                            <video
                                key={isCameraOn ? 'camera-on' : 'camera-off'}
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`absolute inset-0 w-full h-full object-cover bg-black rounded-xl ${isCameraOn ? '' : 'hidden'}`}
                            />
                            <canvas
                                key={isCameraOn ? 'canvas-on' : 'canvas-off'}
                                ref={canvasRef}
                                className={`absolute inset-0 w-full h-full pointer-events-none rounded-xl ${isCameraOn ? '' : 'hidden'}`}
                            />
                            
                            {!isCameraOn && (
                                <div className="absolute inset-0 flex items-center justify-center text-white bg-gray-900 bg-opacity-80 rounded-xl">
                                    <div className="text-center p-4">
                                        <FiCameraOff className="w-20 h-20 mx-auto mb-4 text-gray-400" />
                                        <p className="text-xl font-medium text-gray-300">Câmera desativada</p>
                                        <p className="text-sm text-gray-500 mt-2">Ligue a câmera para começar a traduzir.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="bg-white rounded-2xl shadow-xl p-8 flex flex-col border border-gray-200"
                    >
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Resultado da Tradução</h2>

                        <div className="flex-grow bg-blue-50 rounded-lg p-6 mb-6 flex items-center justify-center min-h-[12rem] border border-blue-200">
                            {translatedText ? (
                                <p className="text-3xl font-semibold text-blue-800 text-center leading-relaxed">
                                    {translatedText}
                                </p>
                            ) : (
                                <p className="text-gray-500 text-center text-xl">
                                    A tradução aparecerá aqui quando você fizer os sinais na câmera.
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-4 justify-center">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={speakText}
                                disabled={!translatedText || isSpeaking}
                                className={`flex-1 flex items-center justify-center py-4 rounded-full font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg
                                    ${translatedText && !isSpeaking ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                            >
                                {isSpeaking ? (
                                    <>
                                        <FiLoader className="animate-spin mr-2 text-xl" /> Lendo...
                                    </>
                                ) : (
                                    <>
                                        <FiVolume2 className="mr-2 text-xl" /> Ouvir Tradução
                                    </>
                                )}
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setTranslatedText('')}
                                disabled={!translatedText}
                                className={`px-6 py-4 rounded-full font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg
                                    ${translatedText ? 'bg-gray-500 hover:bg-gray-600' : 'bg-gray-300 cursor-not-allowed'}`}
                            >
                                <FiTrash2 className="mr-2 text-xl" /> Limpar
                            </motion.button>
                        </div>
                    </motion.div>
                </div>

                {/* Histórico e Dicas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Histórico de Traduções */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200"
                    >
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Histórico de Traduções</h2>
                        {history.length > 0 ? (
                            <ul className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                {history.map((item, index) => (
                                    <li key={`${item.text}-${item.timestamp}-${index}`} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 border-b border-gray-100 last:border-b-0">
                                        <span className="font-medium text-gray-700 text-lg">{item.text}</span>
                                        <span className="text-sm text-gray-500 mt-1 sm:mt-0">{item.timestamp}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-lg">Nenhuma tradução recente.</p>
                        )}
                    </motion.div>

                    {/* Dicas para Melhor Reconhecimento */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200"
                    >
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dicas para Melhor Reconhecimento</h2>
                        <ul className="space-y-4 text-gray-700">
                            <li className="flex items-start">
                                <FiPlay className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                <span>Garanta um ambiente bem iluminado e um fundo claro e uniforme para melhor contraste.</span>
                            </li>
                            <li className="flex items-start">
                                <FiPlay className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                <span>Mantenha as mãos dentro da área demarcada pela câmera, com os dedos visíveis.</span>
                            </li>
                            <li className="flex items-start">
                                <FiPlay className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                <span>Faça os sinais de forma clara, com movimentos definidos e pausados.</span>
                            </li>
                            <li className="flex items-start">
                                <FiPlay className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                <span>Evite movimentos muito rápidos ou que fiquem fora do campo de visão.</span>
                            </li>
                            <li className="flex items-start">
                                <FiPlay className="w-6 h-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
                                <span>O sistema funciona melhor com uma mão de cada vez para sinais mais complexos.</span>
                            </li>
                        </ul>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}

export default TranslatorPage;

