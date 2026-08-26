# Arena Clash — Fundação

Jogo de batalha de cartas 2D, mobile-first (retrato), construído com HTML5 + Phaser 3.

## Como rodar

Como o projeto usa ES modules (`import`), você precisa servir via HTTP (não abre direto com `file://`).

**Opção 1 — Python (mais simples):**
```bash
cd arena-clash
python3 -m http.server 8000
# Acesse http://localhost:8000
