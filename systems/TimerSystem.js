export class TimerSystem {
    constructor(scene) {
        this.scene = scene;
        this.accumulator = 0;
        this.running = false;
    }

    start() { this.running = true; }
    stop()  { this.running = false; }

    update(delta) {
        if (!this.running) return;
        this.accumulator += delta;
        while (this.accumulator >= 1000) {
            this.accumulator -= 1000;
            this.scene.matchManager.tickOneSecond();
            this.scene.events.emit('timer-tick');
        }
    }
}

// Hook no loop da cena
import { BattleScene } from '../battle/BattleScene.js';
// O update do TimerSystem é chamado dentro do update da BattleScene:
// (ajuste feito diretamente em BattleScene para evitar acoplamento circular)
