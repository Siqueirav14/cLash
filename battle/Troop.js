// Tropa genérica. Comportamento dirigido por dados da carta.
import { Pathfinding } from './Pathfinding.js';

export class Troop {
    constructor(scene, config) {
        this.scene = scene;
        this.id = config.id;
        this.side = config.side;
        this.name = config.name;
        this.x = config.x;
        this.y = config.y;

        this.maxHealth = config.health;
        this.currentHealth = config.health;
        this.damage = config.damage;
        this.movementSpeed = config.movementSpeed;   // px/s
        this.attackSpeed = config.attackSpeed;       // ataques/s
        this.attackRange = config.attackRange;
        this.targetType = config.targetType || 'ground';     // ground | air | any
        this.targetPreference = config.targetPreference || 'any'; // any | structures | troops

        this.attackCooldown = 0;
        this.target = null;
        this.isDead = false;

        // Estado de pathfinding
        this.pathState = 'advance'; // advance | to_bridge | crossing | attacking
        this.bridgeTarget = null;

        this.createVisual();
        this.createHealthBar();
    }

    createVisual() {
        const color = this.side === 'player' ? 0x4a9eff : 0xff5a5a;
        const size = 18;
        this.gfx = this.scene.add.graphics();
        this.gfx.fillStyle(color, 1);
        this.gfx.fillCircle(0, 0, size/2);
        this.gfx.lineStyle(2, 0xffffff, 0.8);
        this.gfx.strokeCircle(0, 0, size/2);

        // Indicador de direção
        this.gfx.fillStyle(0xffffff, 0.9);
        const dir = this.side === 'player' ? -1 : 1;
        this.gfx.fillTriangle(-3, dir * 3, 3, dir * 3, 0, dir * 8);

        this.gfx.setPosition(this.x, this.y);
    }

    createHealthBar() {
        this.hpBg = this.scene.add.rectangle(this.x, this.y - 14, 22, 3, 0x000000, 0.7);
        this.hpFill = this.scene.add.rectangle(this.x - 11, this.y - 14, 22, 3, 0x6be38a)
            .setOrigin(0, 0.5);
    }

    updateHealthBar() {
        const ratio = Math.max(0, this.currentHealth / this.maxHealth);
        this.hpFill.width = 22 * ratio;
        if (ratio < 0.3) this.hpFill.fillColor = 0xff5a5a;
        else if (ratio < 0.6) this.hpFill.fillColor = 0xffb347;
        else this.hpFill.fillColor = 0x6be38a;
    }

    takeDamage(amount) {
        if (this.isDead) return;
        this.currentHealth -= amount;
        this.gfx.setTintFill(0xffffff);
        this.scene.time.delayedCall(60, () => {
            if (this.gfx && !this.isDead) this.gfx.clearTint();
        });
        if (this.currentHealth <= 0) {
            this.die();
        } else {
            this.updateHealthBar();
        }
    }

    die() {
        this.isDead = true;
        this.scene.tweens.add({
            targets: this.gfx,
            alpha: 0,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 250,
            onComplete: () => this.gfx.destroy()
        });
        this.scene.tweens.add({
            targets: [this.hpBg, this.hpFill],
            alpha: 0,
            duration: 200,
            onComplete: () => { this.hpBg.destroy(); this.hpFill.destroy(); }
        });
    }

    update(delta, enemies) {
        if (this.isDead) return;

        this.attackCooldown -= delta;

        // 1. Seleciona alvo conforme preferência
        this.target = this.selectTarget(enemies);

        // 2. Se tem alvo e está no alcance → ataca
        if (this.target && this.distanceTo(this.target) <= this.attackRange) {
            if (this.attackCooldown <= 0) {
                this.scene.combat.spawnProjectile(this.x, this.y, this.target, this.damage, this.side);
                this.attackCooldown = 1 / this.attackSpeed;
            }
            return;
        }

        // 3. Senão, move em direção ao alvo (respeitando rio/pontes)
        const nextPos = Pathfinding.getNextStep(this, this.target);
        if (nextPos) {
            const dx = nextPos.x - this.x;
            const dy = nextPos.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 1) {
                const step = this.movementSpeed * delta;
                this.x += (dx / dist) * Math.min(step, dist);
                this.y += (dy / dist) * Math.min(step, dist);
                this.gfx.setPosition(this.x, this.y);
                this.hpBg.setPosition(this.x, this.y - 14);
                this.hpFill.setPosition(this.x - 11, this.y - 14);
            }
        }
    }

    selectTarget(enemies) {
        const sideFilter = this.side === 'player' ? 'enemy' : 'player';
        let candidates = [];

        // Tropas inimigas
        for (const e of enemies.troops) {
            if (e.isDead || e.side !== sideFilter) continue;
            candidates.push(e);
        }
        // Torres inimigas
        for (const t of enemies.towers) {
            if (t.isDestroyed || t.side !== sideFilter) continue;
            candidates.push(t);
        }

        if (candidates.length === 0) return null;

        // Preferência
        if (this.targetPreference === 'structures') {
            candidates = candidates.filter(c => c.kind === 'aux' || c.kind === 'king');
            if (candidates.length === 0) return null;
        }

        // Mais próximo
        let best = null;
        let bestDist = Infinity;
        for (const c of candidates) {
            const d = this.distanceTo(c);
            if (d < bestDist) { bestDist = d; best = c; }
        }
        return best;
    }

    distanceTo(other) {
        return Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
    }
}
