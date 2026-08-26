// Estado global da partida. Mantido simples e acessível.
export const GameState = {
    phase: 'waiting',          // waiting | normal | sudden_death | finished
    timeRemaining: 180,        // segundos
    suddenDeathTimeRemaining: 120,
    elixirMultiplier: 1,
    matchEnded: false,

    player: null,
    enemy: null,

    reset() {
        this.phase = 'waiting';
        this.timeRemaining = 180;
        this.suddenDeathTimeRemaining = 120;
        this.elixirMultiplier = 1;
        this.matchEnded = false;
        this.player = null;
        this.enemy = null;
    }
};
