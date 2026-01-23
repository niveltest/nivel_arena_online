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

  const handleJoin = (name: string, id: string) => {
    setUsername(name);
    setRoomId(id);
    setInGame(true);
  };

  if (inGame) {
    return <GameBoard username={username} roomId={roomId} />;
  }

  if (inDeckBuilder) {
    return <DeckBuilder onBack={() => setInDeckBuilder(false)} />;
  }

  return <Lobby onJoin={handleJoin} onDeckBuilder={() => setInDeckBuilder(true)} />;
}
