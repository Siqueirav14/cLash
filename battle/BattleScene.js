// Cena principal do Phaser. Monta arena, torres, loop de atualização.
import { Tower } from './Tower.js';
import { CombatSystem } from './CombatSystem.js';
import { MatchManager } from '../core/MatchManager.js';
import { TimerSystem } from '../systems/TimerSystem.js';
import { ElixirSystem } from '../systems/ElixirSystem.js';
import { DeckSystem } from '../cards/DeckSystem.js';
import { AIController } from '../ai/AIController.js';
import { Troop } from './Troop.js';
import { ARENA } from './Pathfinding.js';
import { GameState } from '../core/GameState.js';
import { CARD_DB } from '../cards/CardData.js';

export class BattleScene extends Phaser.Scene {
    constructor() { super({ key: 'BattleScene' }); }

    create() {
        this.towers = [];
        this.troops = [];

        this.matchManager = new MatchManager(this);
        this.timer = new TimerSystem(this);
        this.combat = new CombatSystem(this);

        // Elixir e deck de cada lado
        this.playerElixir = new ElixirSystem();
        this.enemyElixir  = new ElixirSystem();
        this.playerDeck = new DeckSystem();
        this.enemyDeck  = new DeckSystem();

        // IA controla o lado inimigo
        this.ai = new AIController(this);

        this.drawArena();
        this.spawnTowers();

        // Inicia partida
        this.matchManager.start();
        this.timer.start();
        this.playerDeck.start();
        this.enemyDeck.start();
        this.ai.start();

        // Expõe estado para UI
        GameState.player = { elixir: this.playerElixir, deck: this.playerDeck };
        GameState.enemy  = { elix: this.enemyElixir, deck: this.enemyDeck };

        // Input de toque/clique para posicionar cartas
        this.selectedCardIndex = null;
        this.input.on('pointerdown', (pointer) => this.onArenaTap(pointer));

        // Evento de fim de partida
        this.events.on('match-ended', (data) => {
            this.showResult(data);
        });
    }

    drawArena() {
        // Fundo dividido em dois lados
        const bg = this.add.graphics();
        bg.fillStyle(0x2d5a3d, 1);
        bg.fillRect(0, 0, ARENA.width, ARENA.riverY - ARENA.riverHeight/2);
        bg.fillRect(0, ARENA.riverY + ARENA.riverHeight/2, ARENA.width, ARENA.height);

        // Rio
        bg.fillStyle(0x3a7bb8, 1);
        bg.fillRect(0, ARENA.riverY - ARENA.riverHeight/2, ARENA.width, ARENA.riverHeight);

        // Pontes
        bg.fillStyle(0x8b6f47, 1);
        const bridgeY = ARENA.riverY - ARENA.riverHeight/2 - 4;
        const bridgeH = ARENA.riverHeight + 8;
        bg.fillRect(ARENA.bridgeLeftX - ARENA.bridgeWidth/2, bridgeY, ARENA.bridgeWidth, bridgeH);
        bg.fillRect(ARENA.bridgeRightX - ARENA.bridgeWidth/2, bridgeY, ARENA.bridgeWidth, bridgeH);

        // Detalhe das pontes
        bg.lineStyle(2, 0x5a4528, 1);
        bg.strokeRect(ARENA.bridgeLeftX - ARENA.bridgeWidth/2, bridgeY, ARENA.bridgeWidth, bridgeH);
        bg.strokeRect(ARENA.bridgeRightX - ARENA.bridgeWidth/2, bridgeY, ARENA.bridgeWidth, bridgeH);

        // Linha divisória do meio (visual)
        bg.lineStyle(1, 0xffffff, 0.1);
        bg.lineBetween(0, ARENA.riverY, ARENA.width, ARENA.riverY);
    }

    spawnTowers() {
        // Layout (coordenadas lógicas 360x640)
        // REI inimigo atrás (y menor), auxiliares mais próximas do rio
        const layout = [
            // INIMIGO
            { side: 'enemy', kind: 'king', x: 180, y: 80,  maxHealth: 4000 },
            { side: 'enemy', kind: 'aux',  x: 80,  y: 180, maxHealth: 2400 },
            { side: 'enemy', kind: 'aux',  x: 280, y: 180, maxHealth: 2400 },
            // JOGADOR
            { side: 'player', kind: 'aux',  x: 80,  y: 460, maxHealth: 2400 },
            { side: 'player', kind: 'aux',  x: 280, y: 460, maxHealth: 2400 },
            { side: 'player', kind: 'king', x: 180, y: 560, maxHealth: 4000 },
        ];

        for (const cfg of layout) {
            this.towers.push(new Tower(this, cfg));
        }
    }

    // Chamado pela UI quando o jogador seleciona uma carta e toca na arena
    tryPlayCard(cardIndex, worldX, worldY) {
        const card = this.playerDeck.hand[cardIndex];
        if (!card) return false;

        const cardData = CARD_DB[card.id];
        if (!cardData) return false;

        // Verifica elixir
        if (this.playerElixir.current < cardData.cost) return false;

        // Verifica zona válida (apenas lado do jogador para tropas comuns)
        if (!this.isValidPlacement(worldX, worldY, cardData)) return false;

        // Consume elixir
        this.playerElixir.spend(cardData.cost);

        // Spawn da tropa
        this.spawnTroop(cardData, 'player', worldX, worldY);

        // Ciclo do deck
        this.playerDeck.useCard(cardIndex);

        return true;
    }

    isValidPlacement(x, y, cardData) {
        // Por enquanto: apenas lado do jogador, fora do rio
        const riverTop = ARENA.riverY - ARENA.riverHeight/2;
        if (y < riverTop + 10) return false; // não pode no rio ou lado inimigo
        if (x < 10 || x > ARENA.width - 10) return false;
        if (y > ARENA.height - 10) return false;
        // Futuro: feitiços podem mirar lado inimigo, aéreos ignoram rio, etc.
        return true;
    }

    spawnTroop(cardData, side, x, y) {
        const troop = new Troop(this, {
            id: cardData.id,
            side,
            name: cardData.name,
            x, y,
            health: cardData.health,
            damage: cardData.damage,
            movementSpeed: cardData.movementSpeed,
            attackSpeed: cardData.attackSpeed,
            attackRange: cardData.attackRange,
            targetType: cardData.targetType,
            targetPreference: cardData.targetPreference
        });
        this.troops.push(troop);
    }

    onArenaTap(pointer) {
        if (this.selectedCardIndex === null) return;
        if (GameState.matchEnded) return;

        const worldPoint = this.input.activePointer.positionToCamera(this.cameras.main);
        const ok = this.tryPlayCard(this.selectedCardIndex, worldPoint.x, worldPoint.y);
        if (ok) {
            this.selectedCardIndex = null;
            this.events.emit('card-deselected');
        }
    }

    update(time, delta) {
        const dt = delta / 1000;

        if (GameState.matchEnded) return;

        // Elixir
        this.playerElixir.update(dt, GameState.elixirMultiplier);
        this.enemyElixir.update(dt, GameState.elixirMultiplier);

        // Atualiza torres (passando tropas inimigas como alvos)
        const playerTroops = this.troops.filter(t => t.side === 'player' && !t.isDead);
        const enemyTroops  = this.troops.filter(t => t.side === 'enemy'  && !t.isDead);

        for (const t of this.towers) {
            if (t.side === 'player') t.update(dt, enemyTroops);
            else t.update(dt, playerTroops);
        }

        // Atualiza tropas
        const enemiesView = {
            troops: this.troops,
            towers: this.towers
        };
        for (const troop of this.troops) {
            troop.update(dt, enemiesView);
        }

        // Limpa tropas mortas antigas (mantém no array até a animação terminar)
        // (remoção real não é necessária — elas ficam marcadas como isDead)

        // Projéteis
        this.combat.update(dt);

        // IA
        this.ai.update(dt);

        // Emite eventos para UI
        this.events.emit('elixir-update', this.playerElixir.current);
    }

    showResult(data) {
        const resultEl = document.getElementById('match-result');
        const titleEl = document.getElementById('result-title');
        const reasonEl = document.getElementById('result-reason');

        titleEl.classList.remove('win', 'lose', 'draw');
        if (data.winner === 'player') {
            titleEl.textContent = 'VITÓRIA';
            titleEl.classList.add('win');
        } else if (data.winner === 'enemy') {
            titleEl.textContent = 'DERROTA';
            titleEl.classList.add('lose');
        } else {
            titleEl.textContent = 'EMPATE';
            titleEl.classList.add('draw');
        }
        reasonEl.textContent = data.reason;
        resultEl.classList.remove('hidden');
    }
}
