export class ElixirSystem {
    constructor() {
        this.current = 5;
        this.max = 10;
        this.baseRate = 1; // elixir por segundo (1x)
    }

    update(dt, multiplier) {
        if (this.current < this.max) {
            this.current = Math.min(this.max, this.current + this.baseRate * multiplier * dt);
        }
    }

    spend(amount) {
        if (this.current < amount) return false;
        this.current -= amount;
        return true;
    }

    canAfford(cost) { return this.current >= cost; }
}
