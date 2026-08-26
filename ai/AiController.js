// IA básica. Usa o mesmo sistema que o jogador.
import { CARD_DB } from '../cards/CardData.js';
import { ARENA } from './Pathfinding.js';

export class AIController {
    constructor(scene) {
        this.scene = scene;
        this.thinkCooldown = 0;
    }

    start() {}

    update(dt) {
        this.thinkCooldown -= dt;
        if (this.thinkCooldown > 0) return;
        this.thinkCooldown = 0.8 + Math.random() * 0.6; // pensa a cada ~1s

        const elixir = this.scene.enemyElixir;
        const deck = this.scene.enemyDeck;

        // Encontra a primeira carta da mão que pode pagar
        for (let i = 0; i < deck.hand.length; i++) {
            const card = deck.hand[i];
            const data = CARD_DB[card.id];
            if (elixir.canAfford(data.cost)) {
                // Decide posição: reativo se houver tropas do jogador, senão ofensivo
                const pos = this.choosePosition();
                this.scene.spawnTroop(data, 'enemy', pos.x, pos.y);
                elixir.spend(data.cost);
                deck.useCard(i);
                return;
            }
        }
    }

    choosePosition() {
        // Heurística simples:
        // - Se há tropas do jogador no lado inimigo, joga perto delas (defesa)
        // - Senão, joga atrás das torres (preparando ataque)
        const playerTroops = this.scene.troops.filter(t => t.side === 'player' && !t.isDead);
        const threats = playerTroops.filter(t => t.y < ARENA.riverY);

        if (threats.length > 0) {
            // Reage à ameaça mais avançada
            const threat = threats.reduce((a, b) => a.y < b.y ? a : b);
            return {
                x: Phaser.Math.Clamp(threat.x + (Math.random() * 40 - 20), 30, ARENA.width - 30),
                y: Phaser.Math.Clamp(threat.y + 40, 100, ARENA.riverY - 30)
            };
        }

        // Ofensivo: atrás das torres auxiliares, aleatoriamente esquerda/direita
        const side = Math.random() < 0.5 ? 80 : 280;
        return {
            x: side + (Math.random() * 40 - 20),
            y: 200 + Math.random() * 60
        };
    }
}
