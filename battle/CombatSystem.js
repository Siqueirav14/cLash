// Gerencia projéteis e aplicação de dano.
export class CombatSystem {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
    }

    spawnProjectile(fromX, fromY, target, damage, side) {
        const gfx = this.scene.add.graphics();
        gfx.fillStyle(side === 'player' ? 0x8fd8ff : 0xffb0b0, 1);
        gfx.fillCircle(0, 0, 4);
        gfx.setPosition(fromX, fromY);

        this.projectiles.push({
            gfx,
            target,
            damage,
            side,
            speed: 380
        });
    }

    update(delta) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            // Se o alvo morreu em trânsito, remove o projétil
            const targetAlive = p.target.isDead !== undefined
                ? !p.target.isDead
                : !p.target.isDestroyed;

            if (!targetAlive) {
                p.gfx.destroy();
                this.projectiles.splice(i, 1);
                continue;
            }

            const dx = p.target.x - p.gfx.x;
            const dy = p.target.y - p.gfx.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < 8) {
                // Aplica dano
                p.target.takeDamage(p.damage);
                p.gfx.destroy();
                this.projectiles.splice(i, 1);
            } else {
                const step = p.speed * delta;
                p.gfx.x += (dx / dist) * step;
                p.gfx.y += (dy / dist) * step;
            }
        }
    }

    clear() {
        for (const p of this.projectiles) p.gfx.destroy();
        this.projectiles = [];
    }
}
