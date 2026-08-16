"use client";

import { useMemo, useState } from "react";
import {
  applyAction,
  createInitialGame,
  getAvailableActions,
  getLocationLabel,
  getLocationPrompt,
  getShopItems,
  type ActionOption,
  type GameAction,
  type GameState
} from "@/lib/game";

function statCard(label: string, value: string) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function Home() {
  const [game, setGame] = useState<GameState>(() => createInitialGame());
  const [showLog, setShowLog] = useState(false);
  const [command, setCommand] = useState("");

  const actions = useMemo(() => getAvailableActions(game), [game]);
  const shopItems = useMemo(() => getShopItems(), []);
  const xpPercent = Math.max(0, Math.min(100, (game.xp / game.xpToNext) * 100));

  function runAction(action: GameAction) {
    setGame((current) => applyAction(current, action));
    setCommand("");
  }

  function submitCommand(value: string) {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return;

    const compact = normalized.replace(/[\s_-]+/g, " ");
    const compactNoSpace = compact.replace(/\s+/g, "");

    const fromLabel = actions.find((option) => {
      const optionLabel = option.label.toLowerCase();
      const optionCompact = optionLabel.replace(/[\s()-]+/g, "");
      return optionLabel === normalized || optionCompact === compactNoSpace;
    });

    if (fromLabel) {
      runAction(fromLabel.action);
      return;
    }

    const weaponName = shopItems.find((item) => {
      const itemName = item.name.toLowerCase();
      return compact.includes(itemName) || compactNoSpace === itemName.replace(/\s+/g, "");
    });

    if (normalized === "look") return runAction({ type: "look" });
    if (normalized === "shop" || normalized === "go to shop" || normalized === "go shop") return runAction({ type: "goToShop" });
    if (normalized === "back" || normalized === "leave shop") return runAction({ type: "leaveShop" });
    if (normalized === "gate" || normalized === "enter gate" || normalized === "go gate") return runAction({ type: "enterGate" });
    if (normalized === "take" && game.groundWeapon) return runAction({ type: "takeGroundWeapon" });
    if (normalized.startsWith("take ") && game.groundWeapon && normalized.includes(game.groundWeapon.toLowerCase())) {
      return runAction({ type: "takeGroundWeapon" });
    }
    if (normalized === "use potion" || normalized === "potion" || normalized === "drink potion") return runAction({ type: "usePotion" });
    if (normalized === "attack") return runAction({ type: "attack" });
    if (normalized === "defend") return runAction({ type: "defend" });
    if (normalized === "run") return runAction({ type: "run" });
    if (normalized === "raid" || normalized === "trigger raid") return runAction({ type: "triggerRaid" });

    if (normalized.startsWith("buy ") && weaponName) {
      return runAction({ type: "buyItem", itemId: weaponName.id });
    }

    const equipTarget = game.inventory.find((weapon) => normalized === `equip ${weapon.toLowerCase()}` || normalized === weapon.toLowerCase());
    if (equipTarget) {
      return runAction({ type: "equipWeapon", weaponName: equipTarget });
    }

    setGame((current) => ({
      ...current,
      log: [`Unknown command: ${value}`, ...current.log].slice(0, 6)
    }));
    setCommand("");
  }

  return (
    <main className="shell">
      {showLog ? (
        <div className="log-overlay" onClick={() => setShowLog(false)}>
          <aside className="log-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="log-drawer-header">
              <h2>Story Log</h2>
              <button onClick={() => setShowLog(false)}>Close</button>
            </div>
            <div className="log">
              {game.log.map((entry, index) => (
                <p key={`${index}-${entry}`}>{entry}</p>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      <header className="topbar">
        <div className="topbar-left">
          <button className="log-toggle" onClick={() => setShowLog(true)}>
            Story log
          </button>
        </div>

        <div className="topbar-center">
          <p className="eyebrow">VillageGuard</p>
          <h1>{game.sceneTitle}</h1>
          <p className="lede">{game.sceneBody || getLocationPrompt(game)}</p>
        </div>

        <aside className="hero-panel">
          <div className="hero-panel-header">
            <span>Hero</span>
            <strong>Current location: {getLocationLabel(game.location)}</strong>
          </div>
          <div className="stats-grid">
            {statCard("HP", `${game.playerHp}/${game.playerMaxHp}`)}
            {statCard("Level", `${game.level}`)}
            {statCard("Gold", `${game.gold}`)}
            {statCard("Potions", `${game.potions}`)}
            {statCard("Weapon", game.equipped ?? "Unarmed")}
          </div>
          <div className="xp-panel" aria-label="Experience progress">
            <div className="xp-meta">
              <span>XP</span>
              <strong>
                {game.xp}/{game.xpToNext}
              </strong>
            </div>
            <div className="xp-track" role="progressbar" aria-valuemin={0} aria-valuemax={game.xpToNext} aria-valuenow={game.xp}>
              <span className="xp-fill" style={{ width: `${xpPercent}%` }} />
            </div>
          </div>
          <div className="mini-copy">
            <p>Inventory: {game.inventory.length ? game.inventory.join(", ") : "Empty"}</p>
          </div>
        </aside>
      </header>

      <section className="terminal-shell panel">
        <div className="terminal-head">
          <div>
            <p className="scene-kicker">Terminal</p>
          </div>
          <p>{getLocationPrompt(game)}</p>
        </div>

        <p className="combat-feed">Latest: {game.log[0]}</p>

        {game.groundWeapon ? (
          <div className="pickup-card">
            <p className="scene-kicker">Item here</p>
            <h3>{game.groundWeapon} on the floor</h3>
            <p>
              Type <strong>take {game.groundWeapon.toLowerCase()}</strong> or tap the quicklink to pick it up.
            </p>
          </div>
        ) : null}

        <form
          className="terminal-input-row"
          onSubmit={(event) => {
            event.preventDefault();
            submitCommand(command);
          }}
        >
          <label className="terminal-prompt" htmlFor="terminal-command">
            &gt;
          </label>
          <input
            id="terminal-command"
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="Type look, go to shop, take sword, buy potion..."
            autoComplete="off"
          />
          <button type="submit">Run</button>
        </form>

        <div className="terminal-quicklinks">
          {actions.map((option: ActionOption) => (
            <button
              key={option.key}
              className={`quick-chip ${option.tone ? option.tone : ""}`}
              onClick={() => runAction(option.action)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}