// Define as conexões entre os pontos da mão para desenhar o esqueleto
const fingerJoints = {
    thumb: [0, 1, 2, 3, 4],
    indexFinger: [0, 5, 6, 7, 8],
    middleFinger: [0, 9, 10, 11, 12],
    ringFinger: [0, 13, 14, 15, 16],
    pinky: [0, 17, 18, 19, 20],
};

// Função para desenhar os landmarks e as conexões no canvas
export const drawHand = (landmarks, ctx) => { // <--- EXPORTAÇÃO NOMEADA
    // Verifica se os landmarks são válidos
    if (landmarks) {
        // Desenha as conexões (esqueleto da mão)
        for (let i = 0; i < Object.keys(fingerJoints).length; i++) {
            let finger = Object.keys(fingerJoints)[i];
            for (let j = 0; j < fingerJoints[finger].length - 1; j++) {
                // Obtém os pontos de início e fim da conexão
                const firstJoint = landmarks[fingerJoints[finger][j]];
                const secondJoint = landmarks[fingerJoints[finger][j + 1]];

                // Desenha a linha
                ctx.beginPath();
                ctx.moveTo(firstJoint[0], firstJoint[1]);
                ctx.lineTo(secondJoint[0], secondJoint[1]);
                ctx.strokeStyle = '#3b82f6'; // Cor da linha (azul)
                ctx.lineWidth = 4; // Espessura da linha
                ctx.stroke();
            }
        }

        // Desenha os pontos (landmarks)
        for (let i = 0; i < landmarks.length; i++) {
            const x = landmarks[i][0];
            const y = landmarks[i][1];

            // Desenha o círculo para cada ponto
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI); // Ponto com raio 6
            ctx.fillStyle = '#ef4444'; // Cor do ponto (vermelho)
            ctx.fill();
        }
    }
};
