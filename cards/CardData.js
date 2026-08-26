// Banco de cartas. Novas cartas são adicionadas aqui.
export const CARD_DB = {
    warrior: {
        id: 'warrior',
        name: 'Guerreiro',
        icon: '⚔️',
        cost: 4,
        type: 'troop',
        health: 1000,
        damage: 120,
        movementSpeed: 70,
        attackSpeed: 1.2,
        attackRange: 22,
        targetType: 'ground',
        targetPreference: 'any'
    },
    archer: {
        id: 'archer',
        name: 'Arqueira',
        icon: '🏹',
        cost: 3,
        type: 'troop',
        health: 500,
        damage: 90,
        movementSpeed: 75,
        attackSpeed: 1.1,
        attackRange: 110,
        targetType: 'any',
        targetPreference: 'any'
    },
    brute: {
        id: 'brute',
        name: 'Bruto',
        icon: '🪓',
        cost: 5,
        type: 'troop',
        health: 1800,
        damage: 180,
        movementSpeed: 50,
        attackSpeed: 1.5,
        attackRange: 24,
        targetType: 'ground',
        targetPreference: 'structures'
    },
    scout: {
        id: 'scout',
        name: 'Batedor',
        icon: '🗡️',
        cost: 2,
        type: 'troop',
        health: 350,
        damage: 70,
        movementSpeed: 110,
        attackSpeed: 1.0,
        attackRange: 20,
        targetType: 'ground',
        targetPreference: 'any'
    }
};

// Deck inicial do jogador (8 cartas, com repetições permitidas para total de 8)
export const DEFAULT_PLAYER_DECK = [
    'warrior', 'warrior',
    'archer',  'archer',
    'brute',   'brute',
    'scout',   'scout'
];
