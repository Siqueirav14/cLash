// Controla o fluxo da partida: tempo, condições de vitória, morte súbita.
import { GameState } from './GameState.js';

export class MatchManager {
    constructor(scene) {
        this.scene = scene;
        this.onMatchEnd = null; // callback para UI
    }

    start() {
        GameState.phase = 'normal';
        GameState.timeRemaining = 180;
        GameState.elixirMultiplier = 1;
    }

    // Chamado a cada segundo pelo TimerSystem
    tickOneSecond() {
        if (GameState.matchEnded) return;

        if (GameState.phase === 'normal') {
            GameState.timeRemaining--;

            // Transição para 2x no último minuto
            if (GameState.timeRemaining === 60) {
                GameState.elixirMultiplier = 2;
                this.scene.events.emit('elixir-phase-change', '2x');
            }

            if (GameState.timeRemaining <= 0) {
                this.evaluateEndOfRegularTime();
            }
        } else if (GameState.phase === 'sudden_death') {
            GameState.suddenDeathTimeRemaining--;
            if (GameState.suddenDeathTimeRemaining <= 0) {
                this.evaluateEndOfSuddenDeath();
            }
        }
    }

    // Chamado sempre que uma torre é destruída
    onTowerDestroyed(side) {
        if (GameState.matchEnded) return;

        const playerTowers = this.scene.towers.filter(t => t.side === 'player' && !t.isDestroyed);
        const enemyTowers  = this.scene.towers.filter(t => t.side === 'enemy'  && !t.isDestroyed);

        this.scene.events.emit('tower-count-changed', {
            player: playerTowers.length,
            enemy: enemyTowers.length
        });

        // Vitória imediata: destruir as 3 torres (incluindo rei)
        if (playerTowers.length === 0) {
            this.endMatch('enemy', 'Todas as suas torres foram destruídas');
        } else if (enemyTowers.length === 0) {
            this.endMatch('player', 'Você destruiu todas as torres inimigas');
        }
        // Morte súbita: primeira torre destruída decide
        else if (GameState.phase === 'sudden_death') {
            this.endMatch(side, 'Torre destruída na morte súbita');
        }
    }

    evaluateEndOfRegularTime() {
        const playerAlive = this.scene.towers.filter(t => t.side === 'player' && !t.isDestroyed).length;
        const enemyAlive  = this.scene.towers.filter(t => t.side === 'enemy'  && !t.isDestroyed).length;

        if (playerAlive > enemyAlive) {
            this.endMatch('player', `Torres: Você ${playerAlive} × ${enemyAlive} IA`);
        } else if (enemyAlive > playerAlive) {
            this.endMatch('enemy', `Torres: Você ${playerAlive} × ${enemyAlive} IA`);
        } else {
            // Empate → morte súbita
            this.startSuddenDeath();
        }
    }

    startSuddenDeath() {
        GameState.phase = 'sudden_death';
        GameState.suddenDeathTimeRemaining = 120;
        GameState.elixirMultiplier = 2.5;
        this.scene.events.emit('phase-change', 'sudden_death');
        this.scene.events.emit('elixir-phase-change', '2.5x');
    }

    evaluateEndOfSuddenDeath() {
        // Desempate: menor vida entre torres sobreviventes
        const playerMinHP = this.getMinTowerHP('player');
        const enemyMinHP  = this.getMinTowerHP('enemy');

        if (playerMinHP < enemyMinHP) {
            this.endMatch('enemy', `Menor vida: Você ${playerMinHP} × ${enemyMinHP} IA`);
        } else if (enemyMinHP < playerMinHP) {
            this.endMatch('player', `Menor vida: Você ${playerMinHP} × ${enemyMinHP} IA`);
        } else {
            this.endMatch('draw', 'Empate absoluto');
        }
    }

    getMinTowerHP(side) {
        const alive = this.scene.towers.filter(t => t.side === side && !t.isDestroyed);
        if (alive.length === 0) return 0;
        return Math.min(...alive.map(t => t.currentHealth));
    }

    endMatch(winner, reason) {
        if (GameState.matchEnded) return;
        GameState.matchEnded = true;
        GameState.phase = 'finished';
        this.scene.events.emit('match-ended', { winner, reason });
        if (this.onMatchEnd) this.onMatchEnd({ winner, reason });
    }
}
