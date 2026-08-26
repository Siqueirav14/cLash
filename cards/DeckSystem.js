import { CARD_DB, DEFAULT_PLAYER_DECK } from './CardData.js';

export class DeckSystem {
    constructor(cardIds = null) {
        this.fullDeck = (cardIds || DEFAULT_PLAYER_DECK).slice();
        this.hand = [];   // 4 cartas
        this.queue = [];  // 4 cartas
    }

    start() {
        // Embaralha
        const shuffled = this.fullDeck.slice().sort(() => Math.random() - 0.5);
        this.hand = shuffled.slice(0, 4).map(id => ({ id }));
        this.queue = shuffled.slice(4, 8).map(id => ({ id }));
    }

    useCard(handIndex) {
        if (handIndex < 0 || handIndex >= this.hand.length) return;
        const used = this.hand.splice(handIndex, 1)[0];
        // Próxima da fila entra na mão
        if (this.queue.length > 0) {
            this.hand.splice(handIndex, 0, this.queue.shift());
        }
        // Carta usada vai para o final da fila
        this.queue.push(used);
    }

    getHandData() {
        return this.hand.map(c => CARD_DB[c.id]);
    }
}
