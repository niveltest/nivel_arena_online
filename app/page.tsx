"use client";

import { useState } from "react";
import Lobby from "../components/Lobby";
import GameBoard from "../components/GameBoard";
import DeckBuilder from "../components/DeckBuilder";

export default function Home() {
  const [inGame, setInGame] = useState(false);
  const [inDeckBuilder, setInDeckBuilder] = useState(false);
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState<string | undefined>(undefined);
  const [isSpectator, setIsSpectator] = useState(false);

  const handleJoin = (name: string, id: string, pwd?: string, spec?: boolean) => {
    setUsername(name);
    setRoomId(id);
    setPassword(pwd);
    setIsSpectator(!!spec);
    setInGame(true);
  };

  if (inGame) {
    return <GameBoard username={username} roomId={roomId} password={password} isSpectator={isSpectator} />;
  }

  if (inDeckBuilder) {
    return <DeckBuilder onBack={() => setInDeckBuilder(false)} />;
  }

  return <Lobby onJoin={handleJoin} onDeckBuilder={() => setInDeckBuilder(true)} />;
}
