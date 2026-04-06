import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Drumstick, Dog, Users, Baby, Skull, RotateCcw, Flag, Home, Gem, Swords } from "lucide-react";

const STAGES = [
  { min: 0, label: "Sobrevivente", icon: Flag },
  { min: 2, label: "Com cachorro", icon: Dog },
  { min: 5, label: "Casado", icon: Home },
  { min: 7, label: "Com filha", icon: Baby },
  { min: 10, label: "Filha casada", icon: Users },
  { min: 15, label: "Velhinho com netos", icon: Gem },
];

type Mode = "solo" | "duelo";
type CardType = "monster" | "safe";

type PlayerState = {
  wins: number;
  steaks: number;
  dogReady: boolean;
  wifeUnlocked: boolean;
  daughterUnlocked: boolean;
  daughterMarried: boolean;
  oldAge: boolean;
  roundsPlayed: number;
  usedDogThisRun: boolean;
  dead: boolean;
  deathReason: string;
  awaitingAdvance: boolean;
  pendingGame: PlayerState | null;
  log: string[];
  cards: { id: number; type: CardType; revealed: boolean }[];
};

function getStage(wins: number) {
  let current = STAGES[0].label;
  for (const s of STAGES) {
    if (wins >= s.min) current = s.label;
  }
  return current;
}

function generateRound(wins: number) {
  const monsterCount = wins >= 14 ? 2 : 1;
  const deck: CardType[] = [];

  for (let i = 0; i < monsterCount; i++) deck.push("monster");
  while (deck.length < 3) deck.push("safe");

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck.map((type, idx) => ({
    id: idx + 1,
    type,
    revealed: false,
  }));
}

function createPlayerState(name?: string): PlayerState {
  return {
    wins: 0,
    steaks: 0,
    dogReady: false,
    wifeUnlocked: false,
    daughterUnlocked: false,
    daughterMarried: false,
    oldAge: false,
    roundsPlayed: 0,
    usedDogThisRun: false,
    dead: false,
    deathReason: "",
    awaitingAdvance: false,
    pendingGame: null,
    log: [name ? `${name} entra em Vale dos Espertos.` : "A noite caiu sobre Vale dos Espertos. Escolha um aldeão e tente sobreviver."],
    cards: generateRound(0),
  };
}

function PlayerSummary({ title, player, active }: { title: string; player: PlayerState; active?: boolean }) {
  const stage = getStage(player.wins);
  return (
    <Card className={`rounded-2xl shadow-xl border-[#e2d8c5] bg-[#f0e9dc] ${active ? "ring-2 ring-amber-400" : ""}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="secondary" className="rounded-xl">{stage}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-center justify-between rounded-xl bg-[#e8dfcf] p-3"><span>Vitórias</span><span>{player.wins}</span></div>
        <div className="flex items-center justify-between rounded-xl bg-[#e8dfcf] p-3"><span className="flex items-center gap-2"><Dog className="w-4 h-4" /> Cachorro</span><span>{player.dogReady ? "Pronto" : player.usedDogThisRun ? "Perdido" : "Não"}</span></div>
        <div className="flex items-center justify-between rounded-xl bg-[#e8dfcf] p-3"><span className="flex items-center gap-2"><Drumstick className="w-4 h-4" /> Bistecas</span><span>{player.steaks}/2</span></div>
        <div className="flex items-center justify-between rounded-xl bg-[#e8dfcf] p-3"><span className="flex items-center gap-2"><Users className="w-4 h-4" /> Esposa</span><span>{player.wifeUnlocked ? "Sim" : "Não"}</span></div>
        <div className="flex items-center justify-between rounded-xl bg-[#e8dfcf] p-3"><span className="flex items-center gap-2"><Baby className="w-4 h-4" /> Filha</span><span>{player.daughterUnlocked ? (player.daughterMarried ? "Casada" : "Sim") : "Não"}</span></div>
      </CardContent>
    </Card>
  );
}

export default function Coma() {
  const [showIntro, setShowIntro] = useState(true);
  const [history, setHistory] = useState<any[]>(() => {
    try {
      const h = localStorage.getItem("coma_history");
      return h ? JSON.parse(h) : [];
    } catch { return []; }
  });

  const [mode, setMode] = useState<Mode>("solo");
  const [game, setGame] = useState<PlayerState>(createPlayerState());
  const [players, setPlayers] = useState<[PlayerState, PlayerState]>([createPlayerState("Jogador 1"), createPlayerState("Jogador 2")]);
  const [currentPlayer, setCurrentPlayer] = useState<0 | 1>(0);
  const [duelState, setDuelState] = useState<{ finalTurn: boolean; deadPlayer: 0 | 1 | null; winner: string | null }>({ finalTurn: false, deadPlayer: null, winner: null });
  const [decision, setDecision] = useState<null | { type: "monster"; canDog: boolean; canSteak: boolean }>(null);

  const active = mode === "solo" ? game : players[currentPlayer];
  // const opponent = mode === "duelo" ? players[currentPlayer === 0 ? 1 : 0] : null;
  const stage = useMemo(() => getStage(active.wins), [active.wins]);
  const progressValue = Math.min((active.wins / 15) * 100, 100);
  const currentStageIndex = STAGES.reduce((acc, s, idx) => (active.wins >= s.min ? idx : acc), 0);

  function pushLog(player: PlayerState, message: string) {
    return [message, ...player.log].slice(0, 10);
  }

  function applyProgression(player: PlayerState, nextWins: number, currentSteaks: number, dogReady: boolean) {
    let steaks = currentSteaks;
    let wifeUnlocked = player.wifeUnlocked;
    let daughterUnlocked = player.daughterUnlocked;
    let daughterMarried = player.daughterMarried;
    let oldAge = player.oldAge;
    const gained: string[] = [];

    if (nextWins >= 2 && !dogReady && !player.usedDogThisRun) {
      dogReady = true;
      gained.push("Você ganhou um cachorro fiel. Ele pode ser comido no seu lugar uma vez.");
    }
    if (nextWins >= 5 && !wifeUnlocked) {
      wifeUnlocked = true;
      gained.push("Você ganhou uma esposa. Agora existe a possibilidade de alimento.");
    }
    if (wifeUnlocked && nextWins >= 6 && nextWins % 2 === 0 && currentSteaks < 2 && steaks < 2) {
      steaks = Math.min(2, steaks + 1);
      gained.push("Sua esposa preparou uma bisteca para a jornada.");
    }
    if (nextWins >= 7 && !daughterUnlocked) {
      daughterUnlocked = true;
      gained.push("Sua filha nasceu. Agora sobreviver pesa diferente.");
    }
    if (nextWins >= 10 && !daughterMarried) {
      daughterMarried = true;
      gained.push("Sua filha se casou. O fim da jornada se aproxima.");
    }
    if (nextWins >= 15 && !oldAge) {
      oldAge = true;
      gained.push("Você chegou à velhice cercado por netos. Isso já é quase um milagre estatístico.");
    }

    return { steaks, wifeUnlocked, daughterUnlocked, daughterMarried, oldAge, dogReady, gained };
  }

  function setActivePlayerState(updated: PlayerState) {
    if (mode === "solo") {
      setGame(updated);
    } else {
      setPlayers(prev => {
        const next: [PlayerState, PlayerState] = [...prev] as [PlayerState, PlayerState];
        next[currentPlayer] = updated;
        return next;
      });
    }
  }

  function getActivePlayerState() {
    return mode === "solo" ? game : players[currentPlayer];
  }

  function saveRun(result: string, wins: number, stageLabel: string, label?: string) {
    const entry = {
      date: new Date().toISOString(),
      wins,
      stage: stageLabel,
      result: label ? `${label}: ${result}` : result,
    };
    const newHistory = [entry, ...history].slice(0, 20);
    setHistory(newHistory);
    try { localStorage.setItem("coma_history", JSON.stringify(newHistory)); } catch {}
  }

  function nextRound(updated: PlayerState, extraLog: string[] = []) {
    const newCards = generateRound(updated.wins);
    const nextState = {
      ...updated,
      awaitingAdvance: false,
      pendingGame: null,
      roundsPlayed: updated.roundsPlayed + 1,
      cards: newCards,
      log: [...extraLog, ...updated.log].slice(0, 10),
    };
    setDecision(null);

    if (mode === "solo") {
      setGame(nextState);
      return;
    }

    setPlayers(prev => {
      const next: [PlayerState, PlayerState] = [...prev] as [PlayerState, PlayerState];
      next[currentPlayer] = nextState;
      return next;
    });

    if (duelState.finalTurn) {
      const deadIdx = duelState.deadPlayer;
      if (deadIdx !== null) {
        const deadWins = players[deadIdx].wins;
        const actorWins = nextState.wins;
        const actorLabel = currentPlayer === 0 ? "Jogador 1" : "Jogador 2";
        const winner = actorWins > deadWins ? actorLabel : "Empate trágico";
        setDuelState({ finalTurn: false, deadPlayer: deadIdx, winner });
        saveRun(winner, actorWins, getStage(actorWins), "Duelo");
      }
      return;
    }

    setCurrentPlayer(currentPlayer === 0 ? 1 : 0);
  }

  function chooseCard(id: number) {
    const player = getActivePlayerState();
    if (player.dead || player.awaitingAdvance || decision || (mode === "duelo" && duelState.winner)) return;

    const selected = player.cards.find((c) => c.id === id);
    if (!selected || selected.revealed) return;

    const revealedCards = player.cards.map((c) => ({ ...c, revealed: true }));

    if (selected.type === "monster") {
      setActivePlayerState({ ...player, cards: revealedCards });
      setDecision({ type: "monster", canDog: player.dogReady, canSteak: player.steaks > 0 });
      return;
    }

    const nextWins = player.wins + 1;
    const progression = applyProgression(player, nextWins, player.steaks, player.dogReady);
    const nextState: PlayerState = {
      ...player,
      wins: nextWins,
      steaks: progression.steaks,
      dogReady: progression.dogReady,
      wifeUnlocked: progression.wifeUnlocked,
      daughterUnlocked: progression.daughterUnlocked,
      daughterMarried: progression.daughterMarried,
      oldAge: progression.oldAge,
      cards: revealedCards,
      log: [`Você sobreviveu à rodada ${nextWins}.`, ...progression.gained, ...player.log].slice(0, 10),
      awaitingAdvance: true,
      pendingGame: null,
    };
    nextState.pendingGame = nextState;
    setActivePlayerState(nextState);
  }

  function resolveWithDog() {
    const player = getActivePlayerState();
    const nextState: PlayerState = {
      ...player,
      dogReady: false,
      usedDogThisRun: true,
      log: pushLog(player, "Seu cachorro foi sacrificado. Você segue vivo."),
      awaitingAdvance: true,
      pendingGame: null,
    };
    nextState.pendingGame = nextState;
    setDecision(null);
    setActivePlayerState(nextState);
  }

  function resolveWithSteak() {
    const player = getActivePlayerState();
    const nextWins = player.wins + 1;
    const progression = applyProgression(player, nextWins, player.steaks - 1, player.dogReady);
    const nextState: PlayerState = {
      ...player,
      wins: nextWins,
      steaks: progression.steaks,
      dogReady: progression.dogReady,
      wifeUnlocked: progression.wifeUnlocked,
      daughterUnlocked: progression.daughterUnlocked,
      daughterMarried: progression.daughterMarried,
      oldAge: progression.oldAge,
      log: ["Você distraiu o monstro com uma bisteca.", ...progression.gained, ...player.log].slice(0, 10),
      awaitingAdvance: true,
      pendingGame: null,
    };
    nextState.pendingGame = nextState;
    setDecision(null);
    setActivePlayerState(nextState);
  }

  function dieNow() {
    const player = getActivePlayerState();
    const deadState = {
      ...player,
      dead: true,
      deathReason: mode === "duelo" ? "O monstro venceu este turno." : "Você hesitou. O monstro não.",
      log: pushLog(player, "Você foi devorado."),
    };
    setDecision(null);

    if (mode === "solo") {
      saveRun("Morreu", player.wins, getStage(player.wins));
      setGame(deadState);
      return;
    }

    setPlayers(prev => {
      const next: [PlayerState, PlayerState] = [...prev] as [PlayerState, PlayerState];
      next[currentPlayer] = deadState;
      return next;
    });

    const other = currentPlayer === 0 ? 1 : 0;
    const otherDead = players[other].dead;
    if (otherDead) {
      setDuelState({ finalTurn: false, deadPlayer: currentPlayer, winner: "Empate trágico" });
      saveRun("Empate trágico", player.wins, getStage(player.wins), "Duelo");
    } else {
      setDuelState({ finalTurn: true, deadPlayer: currentPlayer, winner: null });
      setCurrentPlayer(other);
    }
  }

  function useSteak() {
    const player = getActivePlayerState();
    if (player.dead || player.steaks <= 0 || player.awaitingAdvance || decision || (mode === "duelo" && duelState.winner)) return;

    const safeIndex = player.cards.findIndex((c) => c.type === "safe");
    if (safeIndex === -1) return;

    const forcedCards = player.cards.map((c, idx) => ({ ...c, revealed: idx === safeIndex ? true : c.revealed }));
    const nextWins = player.wins + 1;
    const progression = applyProgression(player, nextWins, player.steaks - 1, player.dogReady);
    const nextState: PlayerState = {
      ...player,
      wins: nextWins,
      steaks: progression.steaks,
      dogReady: progression.dogReady,
      wifeUnlocked: progression.wifeUnlocked,
      daughterUnlocked: progression.daughterUnlocked,
      daughterMarried: progression.daughterMarried,
      oldAge: progression.oldAge,
      cards: forcedCards,
      log: ["Você usou uma bisteca para garantir a fuga.", ...progression.gained, ...player.log].slice(0, 10),
      awaitingAdvance: true,
      pendingGame: null,
    };
    nextState.pendingGame = nextState;
    setActivePlayerState(nextState);
  }

  function advanceRound() {
    const player = getActivePlayerState();
    if (!player.pendingGame) return;
    const extraLog = player.dogReady && !player.pendingGame.dogReady ? ["Você segue vivo, mas agora sem o cachorro."] : [];
    nextRound(player.pendingGame, extraLog);
  }

  function restart() {
    setDecision(null);
    setDuelState({ finalTurn: false, deadPlayer: null, winner: null });
    if (mode === "solo") {
      if (game.dead || game.wins > 0) saveRun(game.dead ? "Morreu" : "Reiniciado", game.wins, getStage(game.wins));
      setGame(createPlayerState());
    } else {
      setPlayers([createPlayerState("Jogador 1"), createPlayerState("Jogador 2")]);
      setCurrentPlayer(0);
    }
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setDecision(null);
    setDuelState({ finalTurn: false, deadPlayer: null, winner: null });
    setGame(createPlayerState());
    setPlayers([createPlayerState("Jogador 1"), createPlayerState("Jogador 2")]);
    setCurrentPlayer(0);
  }

  const duelBanner = mode === "duelo" ? duelState.winner ? `Resultado do duelo: ${duelState.winner}` : duelState.finalTurn ? `Última rodada para ${currentPlayer === 0 ? "Jogador 1" : "Jogador 2"}. Ele precisa superar a marca do rival.` : `Turno de ${currentPlayer === 0 ? "Jogador 1" : "Jogador 2"}` : null;

  return (
    <div className="min-h-screen bg-[#f5f1e6] text-zinc-900 p-6">
      {showIntro ? (
        <div className="max-w-4xl mx-auto min-h-[80vh] flex items-center justify-center">
          <Card className="w-full rounded-3xl shadow-2xl border-[#e2d8c5] bg-[#f0e9dc]">
            <CardContent className="p-10 text-center space-y-6">
              <div className="text-6xl">🐺</div>
              <div className="space-y-3">
                <h1 className="text-4xl font-bold tracking-tight">C.O.M.A. Primeiro</h1>
                <p className="text-lg text-zinc-700">Coma O Meu Amigo Primeiro</p>
                <p className="text-sm text-zinc-600 max-w-2xl mx-auto leading-relaxed">
                  Em Vale dos Espertos, sobreviver nunca é uma questão de coragem. É uma questão de timing,
                  recurso e disposição para ver até onde sua história consegue ir antes que o monstro a interrompa.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
                <div className="rounded-2xl bg-[#e8dfcf] p-4">
                  <div className="font-semibold mb-2">Modo Solo</div>
                  <p className="text-sm text-zinc-700">Construa uma vida em 15 vitórias, administre cachorro e bistecas, e tente chegar à velhice.</p>
                </div>
                <div className="rounded-2xl bg-[#e8dfcf] p-4">
                  <div className="font-semibold mb-2">Modo Duelo</div>
                  <p className="text-sm text-zinc-700">Dois jogadores, dois destinos, uma última chance de superar a marca do rival quando a morte chegar.</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <Button onClick={() => { setMode("solo"); setShowIntro(false); }} className="rounded-2xl px-6">Entrar no modo solo</Button>
                <Button onClick={() => { setMode("duelo"); setShowIntro(false); }} variant="outline" className="rounded-2xl px-6 border-zinc-700">Entrar no modo duelo</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2">
            <Button onClick={() => switchMode("solo")} variant={mode === "solo" ? "default" : "outline"} className="rounded-2xl">Solo</Button>
            <Button onClick={() => switchMode("duelo")} variant={mode === "duelo" ? "default" : "outline"} className="rounded-2xl"><Swords className="w-4 h-4 mr-2" />Modo duelo</Button>
          </div>
          {duelBanner && <div className="text-sm font-medium text-zinc-700">{duelBanner}</div>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 rounded-2xl shadow-xl border-[#e2d8c5] bg-[#f0e9dc]">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <CardTitle className="text-2xl">C.O.M.A. Primeiro — Protótipo</CardTitle>
                  <p className="text-sm text-zinc-600 mt-1">
                    Escolha entre 3 aldeões. Até 13 vitórias há 1 monstro escondido. Nas vitórias 14 e 15, passam a existir 2 monstros.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="rounded-xl">Vitórias: {active.wins}</Badge>
                  <Badge variant="secondary" className="rounded-xl">Fase: {stage}</Badge>
                  <Badge variant="secondary" className="rounded-xl">Rodadas: {active.roundsPlayed}</Badge>
                </div>
              </div>

              <div className="pt-2 space-y-4">
                <div>
                  <Progress value={progressValue} />
                  <div className="text-xs text-zinc-600 mt-2">Ciclo de vida até a velhice: 15 vitórias</div>
                </div>

                <div className="rounded-2xl border border-[#e2d8c5] bg-[#f5f1e6] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-sm font-medium">Caminho das vitórias</div>
                      <div className="text-xs text-zinc-600">Cada marco mostra a vida tomando forma antes de virar comida.</div>
                    </div>
                    <Badge variant="secondary" className="rounded-xl">{active.wins}/15</Badge>
                  </div>
                  <div className="relative">
                    <div className="absolute left-0 right-0 top-5 h-1 rounded-full bg-[#e8dfcf]" />
                    <motion.div className="absolute left-0 top-5 h-1 rounded-full bg-emerald-400" initial={{ width: 0 }} animate={{ width: `${progressValue}%` }} transition={{ duration: 0.4 }} />
                    <div className="relative grid grid-cols-6 gap-2">
                      {STAGES.map((stageItem, idx) => {
                        const Icon = stageItem.icon;
                        const reached = active.wins >= stageItem.min;
                        const activeStage = idx === currentStageIndex;
                        return (
                          <div key={stageItem.min} className="flex flex-col items-center text-center">
                            <motion.div animate={{ scale: activeStage ? 1.08 : 1 }} className={`w-10 h-10 rounded-full border flex items-center justify-center mb-2 ${reached ? "bg-emerald-400 text-zinc-950 border-emerald-300" : "bg-[#f0e9dc] text-zinc-500 border-zinc-700"}`}><Icon className="w-4 h-4" /></motion.div>
                            <div className={`text-[11px] leading-tight ${activeStage ? "text-zinc-900 font-medium" : "text-zinc-600"}`}>{stageItem.label}</div>
                            <div className="text-[10px] text-zinc-500 mt-1">{stageItem.min}+</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {active.awaitingAdvance && <div className="text-sm text-amber-700">Resultado revelado. Clique em Avançar para seguir.</div>}
              </div>
            </CardHeader>

            <CardContent>
              {!active.dead && !(mode === "duelo" && duelState.winner) ? (
                <>
                  {decision && (
                    <div className="mb-4 rounded-2xl border border-amber-700 bg-amber-100 p-4">
                      <div className="text-sm mb-3">O monstro foi revelado. Como você reage?</div>
                      <div className="flex flex-wrap gap-2">
                        {decision.canDog && <Button onClick={resolveWithDog} className="rounded-2xl">Sacrificar cachorro</Button>}
                        {decision.canSteak && <Button onClick={resolveWithSteak} className="rounded-2xl">Usar bisteca</Button>}
                        <Button variant="destructive" onClick={dieNow} className="rounded-2xl">Aceitar morte</Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {active.cards.map((card) => (
                      <motion.button
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        key={card.id}
                        onClick={() => chooseCard(card.id)}
                        disabled={active.awaitingAdvance || !!decision}
                        className={`rounded-2xl border border-zinc-700 bg-[#e8dfcf] p-6 min-h-[220px] text-left ${active.awaitingAdvance || decision ? "opacity-80 cursor-not-allowed" : ""}`}
                      >
                        <div className="flex items-center justify-between mb-6"><span className="text-sm text-zinc-600">Aldeão {card.id}</span><Heart className="w-4 h-4 text-zinc-500" /></div>
                        {!card.revealed ? (
                          <div className="h-full flex items-center justify-center text-center"><div><div className="text-4xl mb-3">🧍</div><div className="font-medium">Virar aldeão</div><div className="text-sm text-zinc-600 mt-2">Talvez haja um monstro. Talvez haja futuro.</div></div></div>
                        ) : card.type === "monster" ? (
                          <div className="h-full flex items-center justify-center text-center"><div><div className="text-5xl mb-3">🐺</div><div className="font-semibold text-red-500">Monstro</div><div className="text-sm text-zinc-600 mt-2">Ele estava esperando.</div></div></div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-center"><div><div className="text-5xl mb-3">🪦</div><div className="font-semibold text-emerald-600">Sobreviveu</div><div className="text-sm text-zinc-600 mt-2">Por enquanto.</div></div></div>
                        )}
                      </motion.button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-3 mt-6">
                    <Button onClick={useSteak} disabled={active.steaks <= 0 || active.awaitingAdvance || !!decision} className="rounded-2xl"><Drumstick className="w-4 h-4 mr-2" />Usar bisteca ({active.steaks})</Button>
                    <Button onClick={advanceRound} disabled={!active.awaitingAdvance} className="rounded-2xl">Avançar</Button>
                    <Button variant="outline" onClick={restart} className="rounded-2xl border-zinc-700"><RotateCcw className="w-4 h-4 mr-2" />Reiniciar</Button>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-red-300 bg-red-100 p-6">
                  <div className="flex items-center gap-3 mb-3"><Skull className="w-6 h-6" /><h2 className="text-xl font-semibold">{mode === "duelo" && duelState.winner ? "Fim do duelo" : "Fim da run"}</h2></div>
                  <p className="text-zinc-700 mb-4">{mode === "duelo" && duelState.winner ? duelState.winner : active.deathReason}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-6">
                    <div className="rounded-xl bg-[#f0e9dc] p-4">Vitórias acumuladas: <strong>{active.wins}</strong></div>
                    <div className="rounded-xl bg-[#f0e9dc] p-4">Estágio alcançado: <strong>{stage}</strong></div>
                  </div>
                  <Button onClick={restart} className="rounded-2xl"><RotateCcw className="w-4 h-4 mr-2" />Jogar de novo</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {mode === "solo" ? (
              <PlayerSummary title="Vida do aldeão" player={game} active />
            ) : (
              <>
                <PlayerSummary title="Jogador 1" player={players[0]} active={currentPlayer === 0} />
                <PlayerSummary title="Jogador 2" player={players[1]} active={currentPlayer === 1} />
              </>
            )}

            <Card className="rounded-2xl shadow-xl border-[#e2d8c5] bg-[#f0e9dc]">
              <CardHeader><CardTitle className="text-lg">Diário de Sobrevivência</CardTitle></CardHeader>
              <CardContent><div className="space-y-2 text-sm text-black">{active.log.map((entry, idx) => <div key={idx} className="rounded-xl bg-[#e8dfcf] p-3">{entry}</div>)}</div></CardContent>
            </Card>

            <Card className="rounded-2xl shadow-xl border-[#e2d8c5] bg-[#f0e9dc]">
              <CardHeader><CardTitle className="text-lg">Histórico de Tentativas</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {history.length === 0 && <div className="text-zinc-500">Nenhuma tentativa ainda.</div>}
                  {history.map((h, i) => <div key={i} className="rounded-xl bg-[#e8dfcf] p-3 flex justify-between gap-3"><span>{h.result} • {h.wins} vitórias</span><span className="text-zinc-600 text-right">{h.stage}</span></div>)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
