// Torre auxiliar. A Torre do Rei herda e sobrescreve comportamento.
export class Tower {
    constructor(scene, config) {
        this.scene = scene;
        this.side = config.side;                // 'player' | 'enemy'
        this.kind = config.kind;                // 'aux' | 'king'
        this.x = config.x;
        this.y = config.y;

        // Atributos base (futuro: escalonados por nível da torre)
        this.maxHealth = config.maxHealth || 2400;
        this.currentHealth = this.maxHealth;
        this.damage = config.damage || 100;
        this.attackRange = config.attackRange || 110;
        this.attackSpeed = config.attackSpeed || 0.9; // ataques por segundo
        this.attackCooldown = 0;

        this.isDestroyed = false;
        this.active = this.kind === 'aux';      // Rei começa desativado

        this.createVisual();
        this.createHealthBar();
    }

    createVisual() {
        const isKing = this.kind === 'king';
        const size = isKing ? 42 : 34;
        const color = this.side === 'player' ? 0x4a9eff : 0xff5a5a;
        const dark  = this.side === 'player' ? 0x2a5a9a : 0x9a2a2a;

        this.gfx = this.scene.add.graphics();
        this.gfx.fillStyle(dark, 1);
        this.gfx.fillRoundedRect(-size/2 - 2, -size/2 - 2, size + 4, size + 4, 6);
        this.gfx.fillStyle(color, 1);
        this.gfx.fillRoundedRect(-size/2, -size/2, size, size, 4);

        if (isKing) {
            // Coroa estilizada
            this.gfx.fillStyle(0xffd86b, 1);
            this.gfx.fillTriangle(-10, -size/2 - 2, 0, -size/2 - 12, 10, -size/2 - 2);
        }

        this.gfx.setPosition(this.x, this.y);

        // Alcance visual (só aparece brevemente ao atacar)
        this.rangeCircle = this.scene.add.graphics();
        this.rangeCircle.setPosition(this.x, this.y);
        this.rangeCircle.setVisible(false);
    }

    createHealthBar() {
        const width = this.kind === 'king' ? 50 : 40;
        const yOffset = this.kind === 'king' ? -32 : -26;

        this.hpBg = this.scene.add.rectangle(this.x, this.y + yOffset, width, 5, 0x000000, 0.7)
            .setOrigin(0.5);
        this.hpFill = this.scene.add.rectangle(this.x - width/2, this.y + yOffset, width, 5, 0x6be38a)
            .setOrigin(0, 0.5);
    }

    updateHealthBar() {
        const width = this.kind === 'king' ? 50 : 40;
        const ratio = Math.max(0, this.currentHealth / this.maxHealth);
        this.hpFill.width = width * ratio;
        // Cor muda conforme vida
        if (ratio < 0.3) this.hpFill.fillColor = 0xff5a5a;
        else if (ratio < 0.6) this.hpFill.fillColor = 0xffb347;
        else this.hpFill.fillColor = 0x6be38a;
    }

    takeDamage(amount) {
        if (this.isDestroyed) return;
        this.currentHealth -= amount;

        // Ativa Torre do Rei ao receber dano
        if (this.kind === 'king' && !this.active) {
            this.activate();
        }

        // Flash de dano
        this.gfx.setTintFill(0xffffff);
        this.scene.time.delayedCall(80, () => {
            if (this.gfx && !this.isDestroyed) this.gfx.clearTint();
        });

        if (this.currentHealth <= 0) {
            this.destroy();
        } else {
            this.updateHealthBar();
        }
    }

    activate() {
        if (this.active) return;
        this.active = true;
        // Feedback visual: brilho dourado
        this.gfx.clear();
        const size = 42;
        this.gfx.lineStyle(3, 0xffd86b, 1);
        this.gfx.strokeRoundedRect(-size/2, -size/2, size, size, 4);
        this.gfx.fillStyle(this.side === 'player' ? 0x4a9eff : 0xff5a5a, 1);
        this.gfx.fillRoundedRect(-size/2 + 2, -size/2 + 2, size - 4, size - 4, 3);
        this.gfx.fillStyle(0xffd86b, 1);
        this.gfx.fillTriangle(-10, -size/2, 0, -size/2 - 10, 10, -size/2);
    }

    destroy() {
        this.isDestroyed = true;
        this.active = false;

        // Animação de destruição
        this.scene.tweens.add({
            targets: this.gfx,
            alpha: 0,
            scaleX: 1.3,
            scaleY: 0.6,
            duration: 400,
            onComplete: () => { this.gfx.destroy(); }
        });
        this.scene.tweens.add({
            targets: [this.hpBg, this.hpFill],
            alpha: 0,
            duration: 300,
            onComplete: () => { this.hpBg.destroy(); this.hpFill.destroy(); }
        });

        // Ativa Torre do Rei aliada quando uma auxiliar é destruída
        const alliedKing = this.scene.towers.find(t =>
            t.side === this.side && t.kind === 'king'
        );
        if (alliedKing && !alliedKing.isDestroyed) {
            alliedKing.activate();
        }

        this.scene.matchManager.onTowerDestroyed(this.side === 'player' ? 'enemy' : 'player');
    }

    update(delta, enemies) {
        if (this.isDestroyed || !this.active) return;

        this.attackCooldown -= delta;

        // Seleciona alvo: tropa mais próxima dentro do alcance
        let target = null;
        let minDist = Infinity;
        for (const e of enemies) {
            if (e.isDead) continue;
            const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
            if (d <= this.attackRange && d < minDist) {
                minDist = d;
                target = e;
            }
        }

        if (target && this.attackCooldown <= 0) {
            this.attack(target);
            this.attackCooldown = 1 / this.attackSpeed;
        }
    }

    attack(target) {
        // Projétil simples
        this.scene.combat.spawnProjectile(this.x, this.y, target, this.damage, this.side);
    }
}
