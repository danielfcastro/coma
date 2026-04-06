# C.O.M.A. Primeiro (Protótipo)

**Coma O Meu Amigo Primeiro**

Em Vale dos Espertos, sobreviver nunca é uma questão de coragem. É uma questão de timing, recurso e disposição para ver até onde sua história consegue ir antes que o monstro a interrompa.

Este é um protótipo de jogo desenvolvido com React, Vite e Shadcn UI, focado em uma experiência de sobrevivência por turnos com mecânicas de gerenciamento de recursos (bistecas e cachorros).

## 🚀 Como Executar o Projeto

Certifique-se de ter o [Node.js](https://nodejs.org/) instalado em sua máquina.

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Acesse no navegador:**
   O Vite geralmente inicia o projeto em `http://localhost:5173`.

## 🛠️ Tecnologias Utilizadas

- **Core**: React 19 + TypeScript
- **Build Tool**: Vite
- **Estilização**: Tailwind CSS 4.0 (com `@tailwindcss/vite`)
- **UI Components**: Shadcn UI (Radix UI)
- **Animações**: Framer Motion
- **Ícones**: Lucide React

## 📂 Estrutura do Projeto

```text
coma/
├── src/
│   ├── assets/             # Ativos estáticos (imagens, svgs)
│   ├── components/
│   │   ├── ui/             # Componentes base do Shadcn UI (Card, Button, etc.)
│   │   └── Coma.tsx        # Lógica principal e interface do jogo
│   ├── lib/
│   │   └── utils.ts        # Utilitários (cn para tailwind-merge)
│   ├── App.tsx             # Componente raiz
│   ├── main.tsx            # Ponto de entrada do React
│   └── index.css           # Configurações globais do Tailwind e Shadcn
├── public/                 # Arquivos públicos estáticos
├── components.json         # Configuração do Shadcn UI
├── tsconfig.json           # Configurações do TypeScript
└── vite.config.ts          # Configuração do Vite e aliases (@/)
```

## 🎮 Modos de Jogo

- **Modo Solo**: Construa uma vida em 15 vitórias, administre cachorro e bistecas, e tente chegar à velhice.
- **Modo Duelo**: Dois jogadores, dois destinos, uma última chance de superar a marca do rival quando a morte chegar.

## 📄 Licença

Este projeto é um protótipo para fins de demonstração e estudo.
