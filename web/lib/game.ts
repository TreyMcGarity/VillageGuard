export type Location = "village" | "shop" | "outside";

export type GameAction =
  | { type: "look" }
  | { type: "goToShop" }
  | { type: "leaveShop" }
  | { type: "enterGate" }
  | { type: "takeGroundWeapon" }
  | { type: "equipWeapon"; weaponName: string }
  | { type: "buyItem"; itemId: string }
  | { type: "usePotion" }
  | { type: "triggerRaid" }
  | { type: "attack" }
  | { type: "defend" }
  | { type: "run" };

export interface ActionOption {
  key: string;
  label: string;
  action: GameAction;
  group: string;
  tone?: "primary" | "accent" | "danger";
}

export interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
}

export interface ShopItem {
  id: string;
  name: string;
  kind: "weapon" | "potion";
  cost: number;
  damage?: number;
  heal?: number;
  description: string;
}

export interface GameState {
  playerHp: number;
  playerMaxHp: number;
  gold: number;
  potions: number;
  location: Location;
  groundWeapon: string | null;
  inventory: string[];
  equipped: string | null;
  enemy: Enemy | null;
  defending: boolean;
  sceneTitle: string;
  sceneBody: string;
  log: string[];
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: "dagger",
    name: "Dagger",
    kind: "weapon",
    cost: 3,
    damage: 3,
    description: "A light blade for quick backup damage."
  },
  {
    id: "spear",
    name: "Spear",
    kind: "weapon",
    cost: 8,
    damage: 5,
    description: "Long reach and reliable field control."
  },
  {
    id: "broadsword",
    name: "Broadsword",
    kind: "weapon",
    cost: 20,
    damage: 8,
    description: "A heavy blade fit for serious raids."
  },
  {
    id: "potion",
    name: "Potion",
    kind: "potion",
    cost: 5,
    heal: 8,
    description: "A standard restorative brew."
  },
  {
    id: "strong-potion",
    name: "Strong Potion",
    kind: "potion",
    cost: 12,
    heal: 16,
    description: "A thicker potion that restores more health."
  }
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pushLog(state: GameState, entry: string): GameState {
  return {
    ...state,
    log: [entry, ...state.log].slice(0, 6)
  };
}

function removeFirstInventoryMatch(items: string[], target: string) {
  const index = items.indexOf(target);
  if (index === -1) {
    return items;
  }

  return [...items.slice(0, index), ...items.slice(index + 1)];
}

function consumePotionItem(items: string[]) {
  const strongPotionIndex = items.indexOf("Strong Potion");
  if (strongPotionIndex !== -1) {
    return {
      inventory: removeFirstInventoryMatch(items, "Strong Potion"),
      heal: 16,
      name: "Strong Potion"
    };
  }

  const potionIndex = items.indexOf("Potion");
  if (potionIndex !== -1) {
    return {
      inventory: removeFirstInventoryMatch(items, "Potion"),
      heal: 8,
      name: "Potion"
    };
  }

  return null;
}

function damageForWeapon(weapon: string | null) {
  if (!weapon) return 1;
  if (weapon === "Sword") return 4;
  if (weapon === "Broadsword") return 8;
  if (weapon === "Spear") return 5;
  if (weapon === "Dagger") return 3;
  return 2;
}

function banditAttack() {
  return randomInt(1, 4);
}

function makeEnemy() {
  const hp = randomInt(6, 9);
  return {
    name: hp > 7 ? "Bandit Captain" : "Bandit",
    hp,
    maxHp: hp
  } satisfies Enemy;
}

export function createInitialGame(): GameState {
  return {
    playerHp: 20,
    playerMaxHp: 20,
    gold: 10,
    potions: 0,
    location: "village",
    groundWeapon: "Sword",
    inventory: [],
    equipped: null,
    enemy: null,
    defending: false,
    sceneTitle: "You wake up in the guard barracks with a village to watch and trouble beyond the gate.",
    sceneBody: "Start in the village, head to the shop for gear, or step outside the gate when you are ready to face bandits.",
    log: [
      "You wake up on a straw mattress in the town guard barracks.",
      "A short sword rests nearby, and the gate to the fields waits outside.",
      "Vendors in the square sell weapons and potions for the watch ahead."
    ]
  };
}

export function getLocationLabel(location: Location) {
  switch (location) {
    case "shop":
      return "Village shop";
    case "outside":
      return "Outside the gate";
    default:
      return "Village barracks";
  }
}

export function getLocationPrompt(state: GameState) {
  if (state.enemy) {
    return "Bandits are attacking. Use the combat actions at the bottom.";
  }

  switch (state.location) {
    case "shop":
      return "Browse the shop inventory and buy only what you can afford.";
    case "outside":
      return "The fields are quiet, but raids can begin at any time.";
    default:
      return state.groundWeapon
        ? "A sword is still on the floor and the shop is open for supplies."
        : "The village is calm. Head to the shop or walk through the gate.";
  }
}

export function getShopItems() {
  return SHOP_ITEMS;
}

export function getAvailableActions(state: GameState): ActionOption[] {
  const actions: ActionOption[] = [{ key: "look", label: "Look around", action: { type: "look" }, group: "Current" }];

  if (state.enemy) {
    actions.push(
      { key: "attack", label: "Attack", action: { type: "attack" }, group: "Combat", tone: "primary" },
      { key: "defend", label: "Defend", action: { type: "defend" }, group: "Combat" },
      { key: "run", label: "Run", action: { type: "run" }, group: "Combat", tone: "danger" }
    );

    if (state.potions > 0) {
      actions.push({ key: "usePotion", label: "Use potion", action: { type: "usePotion" }, group: "Combat" });
    }

    return actions;
  }

  if (state.location === "village") {
    actions.push(
      { key: "goToShop", label: "Go to shop", action: { type: "goToShop" }, group: "Travel", tone: "primary" },
      { key: "enterGate", label: "Enter gate", action: { type: "enterGate" }, group: "Travel" }
    );

    if (state.groundWeapon) {
      actions.push({ key: "takeGroundWeapon", label: `Take ${state.groundWeapon}`, action: { type: "takeGroundWeapon" }, group: "Village" });
    }

    if (state.potions > 0) {
      actions.push({ key: "usePotion", label: "Use potion", action: { type: "usePotion" }, group: "Village" });
    }

    state.inventory
      .filter((weapon) => weapon !== state.equipped)
      .forEach((weapon) => {
        actions.push({
          key: `equip-${weapon}`,
          label: `Equip ${weapon}`,
          action: { type: "equipWeapon", weaponName: weapon },
          group: "Village"
        });
      });

    return actions;
  }

  if (state.location === "shop") {
    actions.push({ key: "leaveShop", label: "Back to village", action: { type: "leaveShop" }, group: "Travel" });

    SHOP_ITEMS.forEach((item) => {
      if (state.gold >= item.cost) {
        actions.push({
          key: `buy-${item.id}`,
          label: `Buy ${item.name} (${item.cost})`,
          action: { type: "buyItem", itemId: item.id },
          group: item.kind === "weapon" ? "Weapons" : "Potions",
          tone: item.kind === "weapon" ? "accent" : "primary"
        });
      }
    });

    return actions;
  }

  actions.push(
    { key: "enterGate", label: "Return to village", action: { type: "enterGate" }, group: "Travel", tone: "primary" },
    { key: "triggerRaid", label: "Trigger raid", action: { type: "triggerRaid" }, group: "Fields", tone: "danger" }
  );

  if (state.potions > 0) {
    actions.push({ key: "usePotion", label: "Use potion", action: { type: "usePotion" }, group: "Fields" });
  }

  return actions;
}

export function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "look": {
      if (state.location === "village") {
        return pushLog(
          {
            ...state,
            sceneTitle: "The village is calm. The barracks, vendors, and gate are all within reach.",
            sceneBody: getLocationPrompt(state)
          },
          state.groundWeapon
            ? "You see a sword resting near the bed, waiting to be taken."
            : "The village square is busy, but the yard near the barracks is clear."
        );
      }

      if (state.location === "shop") {
        return pushLog(
          {
            ...state,
            sceneTitle: "The shopkeeper keeps the counter stocked and the prices visible.",
            sceneBody: getLocationPrompt(state)
          },
          "The shop is lined with weapons and restorative potions."
        );
      }

      return pushLog(
        {
          ...state,
          sceneTitle: "Outside the village, the fields are quiet enough to hear trouble coming.",
          sceneBody: getLocationPrompt(state)
        },
        "The wind moves across the fields. Something dangerous could appear at any moment."
      );
    }
    case "goToShop": {
      if (state.location !== "village") {
        return pushLog(state, "You can only go to the shop from the village.");
      }

      return pushLog(
        {
          ...state,
          location: "shop",
          sceneTitle: "You step into the shop and scan the shelves for better gear.",
          sceneBody: "Choose from the displayed weapons and potions, then return to the village when you are ready."
        },
        "You head to the village shop."
      );
    }
    case "leaveShop": {
      if (state.location !== "shop") {
        return pushLog(state, "You are not in the shop.");
      }

      return pushLog(
        {
          ...state,
          location: "village",
          sceneTitle: "You leave the shop and return to the village square.",
          sceneBody: getLocationPrompt({ ...state, location: "village" })
        },
        "You walk back into the village."
      );
    }
    case "takeGroundWeapon": {
      if (!state.groundWeapon) {
        return pushLog(state, "There is nothing left to take here.");
      }

      return pushLog(
        {
          ...state,
          groundWeapon: null,
          inventory: [...state.inventory, state.groundWeapon],
          equipped: state.equipped ?? state.groundWeapon,
          sceneTitle: "You collect the weapon and feel more prepared for the road ahead.",
          sceneBody: getLocationPrompt({ ...state, groundWeapon: null })
        },
        `You pick up the ${state.groundWeapon.toLowerCase()}.`
      );
    }
    case "equipWeapon": {
      if (!state.inventory.includes(action.weaponName)) {
        return pushLog(state, "You do not have that weapon in your inventory.");
      }

      return pushLog(
        {
          ...state,
          equipped: action.weaponName,
          sceneTitle: `You equip the ${action.weaponName.toLowerCase()} and settle into guard stance.`,
          sceneBody: getLocationPrompt(state)
        },
        `The ${action.weaponName.toLowerCase()} feels ready in your hands.`
      );
    }
    case "enterGate": {
      if (state.location === "shop") {
        return pushLog(state, "Leave the shop first if you want to walk through the gate.");
      }

      const nextLocation: Location = state.location === "village" ? "outside" : "village";
      return pushLog(
        {
          ...state,
          location: nextLocation,
          sceneTitle:
            nextLocation === "outside"
              ? "You step beyond the gate. The open fields are quiet, but not safe."
              : "You return to the village, where the gate and the square feel a little safer.",
          sceneBody: getLocationPrompt({ ...state, location: nextLocation })
        },
        nextLocation === "outside"
          ? "You walk outside the gate and scan the fields."
          : "You head back into the village."
      );
    }
    case "buyItem": {
      if (state.location !== "shop") {
        return pushLog(state, "You can only buy shop items in the village shop.");
      }

      const item = SHOP_ITEMS.find((shopItem) => shopItem.id === action.itemId);
      if (!item) {
        return pushLog(state, "That item is not on the shelf.");
      }

      if (state.gold < item.cost) {
        return pushLog(state, `You cannot afford the ${item.name.toLowerCase()}.`);
      }

      if (item.kind === "weapon") {
        return pushLog(
          {
            ...state,
            gold: state.gold - item.cost,
            inventory: [...state.inventory, item.name],
            equipped: state.equipped ?? item.name,
            sceneTitle: `You buy the ${item.name.toLowerCase()} and add it to your pack.`,
            sceneBody: "The shop still has more supplies if you want to stock up."
          },
          `You buy a ${item.name.toLowerCase()} for ${item.cost} gold.`
        );
      }

      return pushLog(
        {
          ...state,
          gold: state.gold - item.cost,
          potions: state.potions + 1,
          inventory: [...state.inventory, item.name],
          sceneTitle: `You buy the ${item.name.toLowerCase()} and stash it safely.`,
          sceneBody: "The shop keeps its stock visible so you can buy more if you have the gold."
        },
        `You buy a ${item.name.toLowerCase()} for ${item.cost} gold.`
      );
    }
    case "usePotion": {
      if (state.potions <= 0) {
        return pushLog(state, "You do not have any potions to use.");
      }

      const potion = consumePotionItem(state.inventory);
      if (!potion) {
        return pushLog(state, "You have a potion count, but no potion item is visible in your inventory.");
      }

      const healedHp = Math.min(state.playerMaxHp, state.playerHp + potion.heal);
      const healedState = pushLog(
        {
          ...state,
          playerHp: healedHp,
          potions: state.potions - 1,
          inventory: potion.inventory,
          sceneTitle: "Warmth returns to your body after the potion takes hold.",
          sceneBody: getLocationPrompt(state)
        },
        `You drink a ${potion.name.toLowerCase()} and recover ${potion.heal} HP.`
      );

      if (!healedState.enemy) {
        return healedState;
      }

      return enemyTurn({ ...healedState, defending: false });
    }
    case "triggerRaid": {
      if (state.enemy) {
        return pushLog(state, "You are already in a raid.");
      }

      const raidState = pushLog(
        {
          ...state,
          location: "outside",
          enemy: makeEnemy(),
          defending: false,
          sceneTitle: "Bandits emerge from the fields and the watch becomes a fight.",
          sceneBody: "A raid has started. Use the combat actions at the bottom."
        },
        "A bandit raid begins outside the gate."
      );

      // The raid opens with an immediate enemy swing so the player sees incoming damage right away.
      return enemyTurn(raidState);
    }
    case "attack": {
      if (!state.enemy) {
        return pushLog(state, "There is nothing to attack right now.");
      }

      const playerDamage = damageForWeapon(state.equipped);
      const enemyHp = Math.max(0, state.enemy.hp - playerDamage);

      let nextState: GameState = pushLog(
        {
          ...state,
          enemy: enemyHp === 0 ? null : { ...state.enemy, hp: enemyHp },
          sceneTitle:
            enemyHp === 0
              ? "The bandit falls and the field grows quiet again."
              : "The raid continues, and the bandit is still on its feet.",
          sceneBody:
            enemyHp === 0
              ? "The road is clear again, and you can return to normal travel actions."
              : "The bandit is still standing, so combat actions remain available."
        },
        `You strike for ${playerDamage} damage.`
      );

      if (enemyHp === 0) {
        return {
          ...nextState,
          gold: nextState.gold + 5,
          defending: false,
          log: ["You earn 5 gold from the fallen bandit.", ...nextState.log].slice(0, 6)
        };
      }

      nextState = enemyTurn({ ...nextState, defending: false });
      return nextState;
    }
    case "defend": {
      if (!state.enemy) {
        return pushLog(state, "You brace yourself, but there is no attacker yet.");
      }

      return enemyTurn({
        ...state,
        defending: true,
        sceneTitle: "You lower your stance and prepare to absorb the next blow.",
        sceneBody: "Your next enemy hit will be reduced."
      });
    }
    case "run": {
      if (!state.enemy) {
        return pushLog(state, "You are not in danger, so there is nothing to flee from.");
      }

      if (Math.random() < 0.5) {
        return pushLog(
          {
            ...state,
            enemy: null,
            defending: false,
            location: "village",
            sceneTitle: "You get away and slip back toward the village gate.",
            sceneBody: getLocationPrompt({ ...state, location: "village", enemy: null, defending: false })
          },
          "You escape the raid and return to the village."
        );
      }

      return enemyTurn({
        ...state,
        defending: false,
        sceneTitle: "You fail to escape and the bandit presses the attack.",
        sceneBody: "The combat actions remain available until the fight ends."
      });
    }
    default:
      return state;
  }
}

function enemyTurn(state: GameState): GameState {
  if (!state.enemy) {
    return state;
  }

  const incoming = banditAttack();
  const appliedDamage = state.defending ? Math.ceil(incoming / 2) : incoming;
  const nextHp = Math.max(0, state.playerHp - appliedDamage);
  const attackerLabel = state.enemy.name.toLowerCase().includes("captain") ? "bandit captain" : "bandit";

  if (nextHp === 0) {
    return pushLog(
      {
        ...state,
        playerHp: state.playerMaxHp,
        enemy: null,
        defending: false,
        location: "village",
        sceneTitle: "A bandit strike drops you, but the village pulls you back to safety.",
        sceneBody: "You recover in the barracks at full health. Restock and return when ready."
      },
      `A ${attackerLabel} strikes you. You lose ${appliedDamage} life and collapse. Villagers drag you back to the barracks (HP ${state.playerMaxHp}/${state.playerMaxHp}).`
    );
  }

  return pushLog(
    {
      ...state,
      playerHp: nextHp,
      defending: false,
      sceneTitle:
        nextHp === 0
          ? "The raid overwhelms you, and the village loses its guard for now."
          : "You remain in the fight after weathering the counterattack.",
      sceneBody:
        nextHp === 0
          ? "You have been overwhelmed, so the current encounter ends here."
          : "The fight is still active and the combat actions remain available."
    },
    state.defending
      ? `A ${attackerLabel} strikes you. You block part of the blow and lose ${appliedDamage} life (HP ${nextHp}/${state.playerMaxHp}).`
      : `A ${attackerLabel} strikes you. You lose ${appliedDamage} life (HP ${nextHp}/${state.playerMaxHp}).`
  );
}