// Conecta a UI HTML aos sistemas do jogo.
import { CARD_DB } from '../cards/CardData.js';

export class BattleUI {
    constructor(scene) {
        this.scene = scene;
        this.selectedCardIndex = null;
        this.listeners = [];
    }

    bind() {
        const scene = this.scene;

        // Timer
        const onTick = () => this.updateTimer();
        scene.events.on('timer-tick', onTick);
        this.listeners.push(['timer-tick', onTick]);

        // Elixir
        const onElixir = (v) => this.updateElixir(v);
        scene.events.on('elixir-update', onElixir);
        this.listeners.push(['elixir-update', onElixir]);

        // Fase
        const onPhase = (p) => this.updatePhase(p);
        scene.events.on('phase-change', onPhase);
        this.listeners.push(['phase-change', onPhase]);

        const onElixirPhase = (m) => {
            document.getElementById('elixir-multiplier').textContent = m;
        };
        scene.events.on('elixir-phase-change', onElixirPhase);
        this.listeners.push(['elixir-phase-change', onElixirPhase]);

        // Contador de torres
        const onTowers = (counts) => {
            document.getElementById('player-tower-count').textContent = counts.player;
            document.getElementById('enemy-tower-count').textContent  = counts.enemy;
        };
        scene.events.on('tower-count-changed', onTowers);
        this.listeners.push(['tower-count-changed', onTowers]);

        // Deselecionar carta
        const onDeselect = () => {
            this.selectedCardIndex = null;
            this.renderHand();
        };
        scene.events.on('card-deselected', onDeselect);
        this.listeners.push(['card-deselected', onDeselect]);

        // Render inicial
        this.renderHand();
        this.updateTimer();
        this.updateElixir(scene.playerElixir.current);
    }

    renderHand() {
        const container = document.getElementById('hand-container');
        container.innerHTML = '';
        const hand = this.scene.playerDeck.hand;

        hand.forEach((card, idx) => {
            const data = CARD_DB[card.id];
            const el = document.createElement('div');
            el.className = 'card';
            const canAfford = this.scene.playerElixir.canAfford(data.cost);
            if (!canAfford) el.classList.add('disabled');
            if (this.selectedCardIndex === idx) el.classList.add('selected');

            el.innerHTML = `
                <div class="card-cost">${data.cost}</div>
                <div class="card-icon">${data.icon}</div>
                <div class="card-name">${data.name}</div>
            `;

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!canAfford) return;
                if (this.selectedCardIndex === idx) {
                    this.selectedCardIndex = null;
                    this.scene.selectedCardIndex = null;
                } else {
                    this.selectedCardIndex = idx;
                    this.scene.selectedCardIndex = idx;
                }
                this.renderHand();
            });

            container.appendChild(el);
        });
    }

    updateTimer() {
        const gs = this.scene.matchManager;
        let total;
        if (this.scene.gameState?.phase === 'sudden_death') {
            total = this.scene.suddenDeathTimeRemaining;
        } else {
            total = require_time(this.scene);
        }
        total = getTimeRemaining(this.scene);
        const m = Math.floor(total / 60);
        const s = total % 60;
        document.getElementById('timer').textContent =
            `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }

    updateElixir(value) {
        const fill = document.getElementById('elixir-fill');
        const text = document.getElementById('elixir-text');
        const pct = (value / 10) * 100;
        fill.style.width = pct + '%';
        text.textContent = `${Math.floor(value)}/10`;
        this.renderHand(); // atualiza estado disabled
    }

    updatePhase(phase) {
        const label = document.getElementById('phase-label');
        label.textContent = phase === 'sudden_death' ? 'MORTE SÚBITA' : 'NORMAL';
        if (phase === 'sudden_death') label.style.color = '#ff6b6b';
    }

    destroy() {
        for (const [evt, fn] of this.listeners) {
            this.scene.events.off(evt, fn);
        }
        this.listeners = [];
    }
}

function getTimeRemaining(scene) {
    const gs = scene.matchManager;
    // Usa GameState global
    const { GameState } = require('../core/GameState.js');
    if (GameState.phase === 'sudden_death') return GameState.suddenDeathTimeRemaining;
    return GameState.timeRemaining;
}
