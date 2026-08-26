// Entry point do jogo. Inicializa Phaser e conecta a UI HTML.
import { BattleScene } from './battle/BattleScene.js';
import { BattleUI } from './ui/BattleUI.js';
import { GameState } from './core/GameState.js';

const gameRoot = document.getElementById('game-root');
const mainMenu = document.getElementById('main-menu');
const battleScreen = document.getElementById('battle-screen');
const gameContainer = document.getElementById('game-container');

let phaserGame = null;
let battleUI = null;

// Resolução lógica interna (proporção 9:16, ideal para mobile retrato)
const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

function startBattle() {
    mainMenu.classList.remove('active');
    battleScreen.classList.add('active');

    // Reset do estado global
    GameState.reset();

    // Inicializa Phaser apenas na primeira partida
    if (!phaserGame) {
        phaserGame = new Phaser.Game({
            type: Phaser.AUTO,
            parent: 'game-container',
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            backgroundColor: '#1a2438',
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            scene: [BattleScene],
            audio: { noAudio: true } // áudio será adicionado depois
        });
    } else {
        // Reinicia a cena
        phaserGame.scene.start('BattleScene');
    }

    // Conecta UI HTML à cena (aguarda a cena ficar disponível)
    const waitScene = setInterval(() => {
        const scene = phaserGame.scene.getScene('BattleScene');
        if (scene && scene.sys.isActive()) {
            clearInterval(waitScene);
            battleUI = new BattleUI(scene);
            battleUI.bind();
        }
    }, 50);
}

function backToMenu() {
    battleScreen.classList.remove('active');
    mainMenu.classList.add('active');
    document.getElementById('match-result').classList.add('hidden');
    if (phaserGame) {
        const scene = phaserGame.scene.getScene('BattleScene');
        if (scene) scene.scene.stop();
    }
    if (battleUI) { battleUI.destroy(); battleUI = null; }
}

// Listeners
document.getElementById('btn-play').addEventListener('click', startBattle);
document.getElementById('btn-back-menu').addEventListener('click', backToMenu);

// Previne comportamentos nativos que atrapalham
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());
