// Pathfinding simples baseado em zonas.
// Arena dividida em 3 zonas verticais: lado do jogador, rio, lado inimigo.
// Tropas terrestres precisam passar por uma das 2 pontes.

// Coordenadas lógicas (mesmas usadas em BattleScene)
export const ARENA = {
    width: 360,
    height: 640,
    riverY: 320,
    riverHeight: 30,
    bridgeLeftX: 70,
    bridgeRightX: 290,
    bridgeWidth: 60
};

export const Pathfinding = {
    // Retorna o próximo ponto para onde a tropa deve andar
    getNextStep(troop, target) {
        if (!target) return null;

        const isPlayer = troop.side === 'player';
        const riverTop = ARENA.riverY - ARENA.riverHeight / 2;
        const riverBot = ARENA.riverY + ARENA.riverHeight / 2;

        // Determina se precisa atravessar o rio
        const needsCrossing = isPlayer
            ? (troop.y > riverBot && target.y < riverTop)
            : (troop.y < riverTop && target.y > riverBot);

        if (!needsCrossing) {
            // Mesmo lado → vai direto ao alvo
            return { x: target.x, y: target.y };
        }

        // Escolhe a ponte mais próxima
        const bridge = this.chooseBridge(troop, target);
        const bridgeY = ARENA.riverY;

        // Se ainda não chegou na ponte, vai até ela
        const distToBridge = Math.abs(troop.y - bridgeY);
        if (distToBridge > 5) {
            return { x: bridge, y: bridgeY };
        }

        // Passou da ponte → segue ao alvo
        return { x: target.x, y: target.y };
    },

    chooseBridge(troop, target) {
        // Heurística: soma das distâncias (tropas → ponte → alvo)
        const dLeft = Math.abs(troop.x - ARENA.bridgeLeftX) + Math.abs(target.x - ARENA.bridgeLeftX);
        const dRight = Math.abs(troop.x - ARENA.bridgeRightX) + Math.abs(target.x - ARENA.bridgeRightX);
        return dLeft <= dRight ? ARENA.bridgeLeftX : ARENA.bridgeRightX;
    },

    // Verifica se uma posição (x,y) está sobre uma ponte (para validar spawn)
    isOnBridge(x) {
        return (
            (x >= ARENA.bridgeLeftX - ARENA.bridgeWidth/2 && x <= ARENA.bridgeLeftX + ARENA.bridgeWidth/2) ||
            (x >= ARENA.bridgeRightX - ARENA.bridgeWidth/2 && x <= ARENA.bridgeRightX + ARENA.bridgeWidth/2)
        );
    }
};
