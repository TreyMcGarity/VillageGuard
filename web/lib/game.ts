export type Location = "village" | "shop" | "outside";
export type QuestStatus = "available" | "active" | "completed";

export interface NPC {
  id: string;
  name: string;
  title: string;
  blurb: string;
  greeting: string;
  rumor: string;
}

export interface QuestState {
  id: string;
  title: string;
  description: string;
  npcId: string;
  target: number;
  progress: number;
  rewardXp: number;
  rewardGold: number;
  rewardPotions: number;
  status: QuestStatus;
}

export type GameAction =
  | { type: "look" }
  | { type: "goToShop" }
  | { type: "leaveShop" }
  | { type: "enterGate" }
  | { type: "takeGroundWeapon" }
  | { type: "equipWeapon"; weaponName: string }
  | { type: "buyItem"; itemId: string }
  | { type: "usePotion" }
  | { type: "talkToNpc"; npcId: string }
  | { type: "acceptQuest"; questId: string }
  | { type: "completeQuest"; questId: string }
  | { type: "restAtInn" }
  | { type: "triggerRaid" }
  | { type: "attack" }
  | { type: "defend" }
  | { type: "run" }
  | { type: "setTarget"; index: number };

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
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  potions: number;
  raidsTriggered: number;
  raidsWon: number;
  location: Location;
  groundWeapon: string | null;
  inventory: string[];
  equipped: string | null;
  enemies: Enemy[];
  targetIndex: number;
  defending: boolean;
  selectedNpcId: string | null;
  dialogue: string;
  quests: QuestState[];
  villageRumors: string[];
  sceneTitle: string;
  sceneBody: string;
  log: string[];
}

export const VILLAGE_NPCS: NPC[] = [
  {
    id: "elder",
    name: "Elder Rowan",
    title: "Village elder",
    blurb: "Keeps the square calm and the town informed.",
    greeting: "The village needs steady hands. If you can keep the road safe, we can all breathe easier.",
    rumor: "Bandits have been seen near the north road. Watch your step if you head outside the gate."
  },
  {
    id: "shopkeeper",
    name: "Mira",
    title: "Shopkeeper",
    blurb: "Sells tools, blades, and much-needed potions.",
    greeting: "A good blade is worth more than luck. Take a look at what I have before you go beyond the gate.",
    rumor: "Fresh spears sell fast in a nervous town, and the watch always needs more stock."
  },
  {
    id: "innkeeper",
    name: "Bram",
    title: "Innkeeper",
    blurb: "Keeps the inn warm, the beds full, and the gossip flowing.",
    greeting: "You look tired. Rest a while and listen to what the village is whispering tonight.",
    rumor: "There are whispers of a larger bandit crew gathering near the old bridge."
  }
];

const VILLAGE_RUMORS = [
  "The blacksmith swears he heard metal clanging past midnight.",
  "A wagon of grain was found overturned near the south road.",
  "The scouts say a captain has been moving men between the fields and the ruins.",
  "The old well has been drawing odd sounds at dusk lately."
];

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function makeInitialQuests(): QuestState[] {
  return [
    {
      id: "roadside-watch",
      title: "Roadside Watch",
      description: "Defeat 2 bandit raiders outside the village gates to keep the road safe.",
      npcId: "elder",
      target: 2,
      progress: 0,
      rewardXp: 30,
      rewardGold: 20,
      rewardPotions: 1,
      status: "available"
    }
  ];
}

function updateQuestProgress(state: GameState, completedRaidCount: number): GameState {
  if (completedRaidCount <= 0) {
    return state;
  }

  const nextQuests: QuestState[] = state.quests.map((quest) => {
    if (quest.id !== "roadside-watch" || quest.status === "completed") {
      return quest;
    }

    const progress = Math.min(quest.target, quest.progress + completedRaidCount);
    return { ...quest, progress, status: "active" };
  });

  return { ...state, quests: nextQuests };
}

function getNpcById(npcId: string | null) {
  if (!npcId) return null;
  return VILLAGE_NPCS.find((npc) => npc.id === npcId) ?? null;
}

function getQuestForNpc(state: GameState, npcId: string) {
  return state.quests.find((quest) => quest.npcId === npcId && quest.status !== "completed") ?? null;
}

function isQuestReadyForCompletion(quest: QuestState) {
  return quest.progress >= quest.target && quest.status === "active";
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

function playerAttackDamage(weapon: string | null, level: number) {
  const base = damageForWeapon(weapon);
  const levelBonus = Math.floor((level - 1) / 2);
  return base + levelBonus;
}

function xpRequiredForLevel(level: number) {
  return 12 + (level - 1) * 8;
}

function enemyXpValue(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("captain")) return 14;
  if (normalized.includes("scout")) return 5;
  return 8;
}

function grantXp(state: GameState, amount: number): GameState {
  if (amount <= 0) return state;

  let next = pushLog(state, `You gain ${amount} XP.`);
  let remaining = amount;

  while (remaining > 0) {
    const needed = next.xpToNext - next.xp;
    const applied = Math.min(remaining, needed);
    next = { ...next, xp: next.xp + applied };
    remaining -= applied;

    if (next.xp >= next.xpToNext) {
      const newLevel = next.level + 1;
      const newMaxHp = next.playerMaxHp + 3;
      const recoveredHp = Math.min(newMaxHp, next.playerHp + 3);
      next = {
        ...next,
        level: newLevel,
        xp: 0,
        xpToNext: xpRequiredForLevel(newLevel),
        playerMaxHp: newMaxHp,
        playerHp: recoveredHp
      };
      next = pushLog(next, `Level up! You are now level ${newLevel}. Max HP increased to ${newMaxHp}.`);
    }
  }

  return next;
}

const BANDIT_ATTACK_VERBS = [
  "slashes at you",
  "lunges with a blade",
  "swings wildly",
  "drives a fist into your side",
  "throws a heavy blow",
  "feints then strikes"
];

const CAPTAIN_ATTACK_VERBS = [
  "barks an order and charges",
  "swings a heavy axe",
  "drives a shield-bash into you",
  "steps forward with a brutal cut",
  "roars and strikes hard"
];

function banditAttack() {
  return randomInt(1, 4);
}

function enemyAttackVerb(name: string) {
  const isCaptain = name.toLowerCase().includes("captain");
  const pool = isCaptain ? CAPTAIN_ATTACK_VERBS : BANDIT_ATTACK_VERBS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function enemyHpDescription(enemy: Enemy): string {
  const ratio = enemy.hp / enemy.maxHp;
  if (ratio > 0.75) return "looking confident";
  if (ratio > 0.5) return "breathing hard";
  if (ratio > 0.25) return "staggering but dangerous";
  return "barely standing — finish them!";
}

function makeEnemyForLevel(level: number, firstRaid: boolean): Enemy {
  const clampedLevel = Math.max(1, level);
  const captainChance = firstRaid ? 0 : Math.min(0.1 + (clampedLevel - 2) * 0.08, 0.35);
  const scoutChance = clampedLevel <= 1 ? 0.45 : 0.25;
  const roll = Math.random();

  if (roll < scoutChance) {
    const hp = randomInt(4, 6) + Math.floor((clampedLevel - 1) / 3);
    return { name: "Bandit Scout", hp, maxHp: hp };
  }

  if (roll < 1 - captainChance) {
    const hp = randomInt(6, 9) + Math.floor((clampedLevel - 1) / 2);
    return { name: "Bandit", hp, maxHp: hp };
  }

  const hp = randomInt(10, 14) + Math.max(0, clampedLevel - 2);
  return { name: "Bandit Captain", hp, maxHp: hp };
}

function makeRaid(level: number, raidsTriggered: number): Enemy[] {
  const firstRaid = raidsTriggered === 0;
  let count: number;

  if (firstRaid) count = 2;
  else if (level <= 1) count = randomInt(2, 3);
  else if (level === 2) count = randomInt(2, 3);
  else if (level === 3) count = randomInt(3, 4);
  else count = randomInt(3, 5);

  return Array.from({ length: count }, () => makeEnemyForLevel(level, firstRaid));
}

function activeTarget(state: GameState): Enemy | null {
  const idx = state.targetIndex < state.enemies.length ? state.targetIndex : 0;
  return state.enemies[idx] ?? null;
}

function withoutEnemy(enemies: Enemy[], index: number): { enemies: Enemy[]; targetIndex: number } {
  const next = enemies.filter((_, i) => i !== index);
  return { enemies: next, targetIndex: Math.max(0, Math.min(index, next.length - 1)) };
}

export function createInitialGame(): GameState {
  const initialDialogue = "The village square is waking up. Mira is stacking supplies, Bram is wiping down the inn counter, and Elder Rowan is watching the gate with concern.";

  return {
    playerHp: 20,
    playerMaxHp: 20,
    level: 1,
    xp: 0,
    xpToNext: xpRequiredForLevel(1),
    gold: 10,
    potions: 0,
    raidsTriggered: 0,
    raidsWon: 0,
    location: "village",
    groundWeapon: "Sword",
    inventory: [],
    equipped: null,
    enemies: [],
    targetIndex: 0,
    defending: false,
    selectedNpcId: "elder",
    dialogue: initialDialogue,
    quests: makeInitialQuests(),
    villageRumors: [
      "A farmer says major trouble is moving about the north field.",
      "The inn is buzzing with talk of bandits near the bridge."
    ],
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
  if (state.enemies.length > 0) {
    const targetIdx = state.targetIndex < state.enemies.length ? state.targetIndex : 0;
    const target = state.enemies[targetIdx];
    const roster = state.enemies
      .map((e, i) => `${i === targetIdx ? "▶ " : ""}${e.name} (HP ${e.hp}/${e.maxHp})`)
      .join("  |  ");
    return `Targeting: ${target.name} — ${enemyHpDescription(target)}.  ${roster}`;
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

  if (state.enemies.length > 0) {
    actions.push(
      { key: "attack", label: "Attack", action: { type: "attack" }, group: "Combat", tone: "primary" },
      { key: "defend", label: "Defend", action: { type: "defend" }, group: "Combat" },
      { key: "run", label: "Run", action: { type: "run" }, group: "Combat", tone: "danger" }
    );

    if (state.potions > 0) {
      actions.push({ key: "usePotion", label: "Use potion", action: { type: "usePotion" }, group: "Combat" });
    }

    if (state.enemies.length > 1) {
      state.enemies.forEach((enemy, i) => {
        actions.push({
          key: `target-${i}`,
          label: `Target ${enemy.name} (HP ${enemy.hp}/${enemy.maxHp})`,
          action: { type: "setTarget", index: i },
          group: "Target",
          tone: i === state.targetIndex ? "accent" : undefined
        });
      });
    }

    return actions;
  }

  if (state.location === "village") {
    actions.push(
      { key: "goToShop", label: "Go to shop", action: { type: "goToShop" }, group: "Travel", tone: "primary" },
      { key: "enterGate", label: "Enter gate", action: { type: "enterGate" }, group: "Travel" },
      { key: "restAtInn", label: "Rest at inn", action: { type: "restAtInn" }, group: "Village" }
    );

    VILLAGE_NPCS.forEach((npc) => {
      actions.push({
        key: `talk-${npc.id}`,
        label: `Talk to ${npc.name}`,
        action: { type: "talkToNpc", npcId: npc.id },
        group: "Village"
      });
    });

    const elderQuest = state.quests.find((quest) => quest.npcId === "elder" && quest.status !== "completed");
    if (elderQuest && elderQuest.status === "available") {
      actions.push({
        key: `accept-${elderQuest.id}`,
        label: `Accept ${elderQuest.title}`,
        action: { type: "acceptQuest", questId: elderQuest.id },
        group: "Quests",
        tone: "accent"
      });
    }

    if (state.quests.some((quest) => quest.status === "active" && quest.progress >= quest.target)) {
      actions.push({
        key: "completeQuest",
        label: "Complete quest",
        action: { type: "completeQuest", questId: state.quests.find((quest) => quest.status === "active" && quest.progress >= quest.target)!.id },
        group: "Quests",
        tone: "primary"
      });
    }

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
          sceneBody: "Choose from the displayed weapons and potions, then return to the village when you are ready.",
          selectedNpcId: "shopkeeper"
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
          sceneBody: getLocationPrompt({ ...state, location: "village" }),
          selectedNpcId: "shopkeeper"
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

      if (healedState.enemies.length === 0) {
        return healedState;
      }

      return enemyTurn({ ...healedState, defending: false });
    }
    case "talkToNpc": {
      const npc = getNpcById(action.npcId);
      if (!npc) {
        return pushLog(state, "There is no one to talk to here.");
      }

      const quest = getQuestForNpc(state, npc.id);
      const questLine = quest
        ? quest.status === "available"
          ? `You can take the quest, ${quest.title}.`
          : quest.progress >= quest.target
          ? `You have finished ${quest.title}. Return and complete it.`
          : `${quest.title} is in progress (${quest.progress}/${quest.target}).`
        : "The town is quiet for now, but the gossip is always moving.";

      const rumor = randomItem(state.villageRumors.length > 0 ? state.villageRumors : [npc.rumor]);
      return pushLog(
        {
          ...state,
          selectedNpcId: npc.id,
          dialogue: `${npc.name}: "${npc.greeting}" ${questLine} ${rumor}`,
          sceneTitle: `${npc.name} is listening by the square.`,
          sceneBody: `You speak with ${npc.name}, the ${npc.title.toLowerCase()}.`
        },
        `${npc.name} says: "${npc.greeting}"`
      );
    }
    case "acceptQuest": {
      const quest = state.quests.find((item) => item.id === action.questId);
      if (!quest) {
        return pushLog(state, "That quest is not available.");
      }

      if (quest.status !== "available") {
        return pushLog(state, "You already accepted that task.");
      }

      return pushLog(
        {
          ...state,
          quests: state.quests.map((item) => (item.id === action.questId ? { ...item, status: "active" } : item)),
          dialogue: `${quest.title}: ${quest.description}`,
          sceneTitle: `${quest.title} accepted.`,
          sceneBody: "The village is counting on you. Return when the road is clear and your work is done."
        },
        `You accept the ${quest.title} quest from ${getNpcById(quest.npcId)?.name ?? "the village"}.`
      );
    }
    case "completeQuest": {
      const quest = state.quests.find((item) => item.id === action.questId);
      if (!quest) {
        return pushLog(state, "That quest cannot be completed right now.");
      }

      if (quest.status !== "active" || quest.progress < quest.target) {
        return pushLog(state, `The ${quest.title} quest is not ready yet.`);
      }

      const rewardedState = pushLog(
        {
          ...state,
          gold: state.gold + quest.rewardGold,
          potions: state.potions + quest.rewardPotions,
          quests: state.quests.map((item) => (item.id === action.questId ? { ...item, status: "completed" } : item)),
          dialogue: `${quest.title} complete. The village is grateful, and your pack feels a little heavier.`,
          sceneTitle: `${quest.title} complete!`,
          sceneBody: "The village grows calmer, and the road feels safer for everyone."
        },
        `You complete ${quest.title} and earn ${quest.rewardXp} XP, ${quest.rewardGold} gold, and ${quest.rewardPotions} potion${quest.rewardPotions === 1 ? "" : "s"}.`
      );

      return grantXp(rewardedState, quest.rewardXp);
    }
    case "restAtInn": {
      if (state.location !== "village") {
        return pushLog(state, "You can only rest at the inn in the village.");
      }

      if (state.gold < 4) {
        return pushLog(state, "Bram says the inn has beds for paying guests, and you do not have enough coin.");
      }

      const recovered = Math.min(state.playerMaxHp, state.playerHp + 8);
      return pushLog(
        {
          ...state,
          gold: state.gold - 4,
          playerHp: recovered,
          dialogue: `Bram: "Rest easy. The village has plenty of stories, and a few of them are worth hearing." ${randomItem(state.villageRumors)}`,
          sceneTitle: "You take a warm bed in the inn and recover your strength.",
          sceneBody: "The inn is quiet for a while, and the village gossip makes the room feel alive."
        },
        `You pay 4 gold to rest at the inn and recover ${recovered - state.playerHp} HP.`
      );
    }
    case "triggerRaid": {
      if (state.enemies.length > 0) {
        return pushLog(state, "You are already in a raid.");
      }

      const raidEnemies = makeRaid(state.level, state.raidsTriggered);
      const raidNames = raidEnemies.map((e) => e.name).join(", ");
      const raidState = pushLog(
        {
          ...state,
          location: "outside",
          raidsTriggered: state.raidsTriggered + 1,
          enemies: raidEnemies,
          targetIndex: 0,
          defending: false,
          sceneTitle: `${raidEnemies.length} raiders charge from the treeline — ${raidNames}!`,
          sceneBody: getLocationPrompt({ ...state, enemies: raidEnemies, targetIndex: 0, defending: false })
        },
        `${raidEnemies.length} bandits pour out of the fields: ${raidNames}. Target one and fight!`
      );

      return enemyTurn(raidState);
    }
    case "attack": {
      if (state.enemies.length === 0) {
        return pushLog(state, "There is nothing to attack right now.");
      }

      const playerDamage = playerAttackDamage(state.equipped, state.level);
      const weaponLabel = state.equipped ? state.equipped.toLowerCase() : "fists";
      const targetIdx = state.targetIndex < state.enemies.length ? state.targetIndex : 0;
      const target = state.enemies[targetIdx];
      const newTargetHp = Math.max(0, target.hp - playerDamage);
      const targetDefeated = newTargetHp === 0;

      let newEnemies: Enemy[];
      let newTargetIndex: number;
      if (targetDefeated) {
        const result = withoutEnemy(state.enemies, targetIdx);
        newEnemies = result.enemies;
        newTargetIndex = result.targetIndex;
      } else {
        newEnemies = state.enemies.map((e, i) => (i === targetIdx ? { ...e, hp: newTargetHp } : e));
        newTargetIndex = targetIdx;
      }

      const allDefeated = newEnemies.length === 0;
      const remaining = newEnemies.length;

      let nextState: GameState = pushLog(
        {
          ...state,
          enemies: newEnemies,
          targetIndex: newTargetIndex,
          sceneTitle: allDefeated
            ? "All raiders are down — the field falls quiet."
            : targetDefeated
            ? `The ${target.name} falls! ${remaining} raider${remaining > 1 ? "s" : ""} still standing.`
            : `${target.name} reels (HP ${newTargetHp}/${target.maxHp}) — ${remaining} raider${remaining > 1 ? "s" : ""} remain.`,
          sceneBody: allDefeated
            ? "The road is clear. You can return to normal travel actions."
            : getLocationPrompt({ ...state, enemies: newEnemies, targetIndex: newTargetIndex, defending: false })
        },
        targetDefeated
          ? `You drive your ${weaponLabel} into the ${target.name} for ${playerDamage} damage. They are down!`
          : `You swing your ${weaponLabel} at the ${target.name} for ${playerDamage} damage. ${enemyHpDescription({ ...target, hp: newTargetHp })}.`
      );

      if (targetDefeated) {
        nextState = { ...nextState, gold: nextState.gold + 5 };
        nextState = pushLog(nextState, `You search the fallen ${target.name} and find 5 gold.`);
        nextState = grantXp(nextState, enemyXpValue(target.name));
      }

      if (allDefeated) {
        const clearBonusXp = 6 + Math.max(0, state.level - 1) * 2;
        const withBonus = grantXp({ ...nextState, raidsWon: nextState.raidsWon + 1 }, clearBonusXp);
        const questProgressed = updateQuestProgress({ ...withBonus, defending: false }, 1);
        return pushLog({ ...questProgressed, defending: false }, `Raid cleared! Bonus ${clearBonusXp} XP.`);
      }

      return enemyTurn({ ...nextState, defending: false });
    }
    case "defend": {
      if (state.enemies.length === 0) {
        return pushLog(state, "You brace yourself, but there is no attacker yet.");
      }

      const defTarget = activeTarget(state)!;
      return enemyTurn({
        ...state,
        defending: true,
        sceneTitle: `You raise your guard against the ${defTarget.name}.`,
        sceneBody: `${defTarget.name} (HP ${defTarget.hp}/${defTarget.maxHp}) presses in — the incoming blow will be halved.`
      });
    }
    case "run": {
      if (state.enemies.length === 0) {
        return pushLog(state, "You are not in danger, so there is nothing to flee from.");
      }

      const escapeLabel = state.enemies.length > 1 ? `${state.enemies.length} bandits` : `the ${state.enemies[0].name}`;

      if (Math.random() < 0.5) {
        return pushLog(
          {
            ...state,
            enemies: [],
            targetIndex: 0,
            defending: false,
            location: "village",
            sceneTitle: `You break away from ${escapeLabel} and sprint for the gate!`,
            sceneBody: getLocationPrompt({ ...state, location: "village", enemies: [], targetIndex: 0, defending: false })
          },
          `You escape ${escapeLabel} and make it back to the village.`
        );
      }

      return enemyTurn({
        ...state,
        defending: false,
        sceneTitle: `${escapeLabel.charAt(0).toUpperCase() + escapeLabel.slice(1)} cut off your escape!`,
        sceneBody: getLocationPrompt(state)
      });
    }
    case "setTarget": {
      if (action.index < 0 || action.index >= state.enemies.length) {
        return pushLog(state, "That target is not available.");
      }
      const newTarget = state.enemies[action.index];
      return pushLog(
        {
          ...state,
          targetIndex: action.index,
          sceneTitle: `You shift focus to the ${newTarget.name}.`,
          sceneBody: getLocationPrompt({ ...state, targetIndex: action.index })
        },
        `You target the ${newTarget.name} (HP ${newTarget.hp}/${newTarget.maxHp}, ${enemyHpDescription(newTarget)}).`
      );
    }
    default:
      return state;
  }
}

function enemyTurn(state: GameState): GameState {
  if (state.enemies.length === 0) {
    return state;
  }

  // A random surviving enemy takes a swing.
  const attackerIdx = Math.floor(Math.random() * state.enemies.length);
  const attacker = state.enemies[attackerIdx];
  const incoming = banditAttack();
  const appliedDamage = state.defending ? Math.ceil(incoming / 2) : incoming;
  const nextHp = Math.max(0, state.playerHp - appliedDamage);
  const verb = enemyAttackVerb(attacker.name);

  if (nextHp === 0) {
    return pushLog(
      {
        ...state,
        playerHp: state.playerMaxHp,
        enemies: [],
        targetIndex: 0,
        defending: false,
        location: "village",
        sceneTitle: `The ${attacker.name}'s blow drops you — villagers drag you back through the gate.`,
        sceneBody: "You recover in the barracks at full health. Restock and return when ready."
      },
      `The ${attacker.name} ${verb} and deals ${appliedDamage} — you collapse. Villagers haul you to safety (HP ${state.playerMaxHp}/${state.playerMaxHp}).`
    );
  }

  const survivalNote = nextHp <= state.playerMaxHp * 0.3 ? " You are badly wounded!" : "";
  return pushLog(
    {
      ...state,
      playerHp: nextHp,
      defending: false,
      sceneTitle: `The ${attacker.name} hits you for ${appliedDamage}${state.defending ? " (blocked)" : ""} — you have ${nextHp} HP left.`,
      sceneBody: getLocationPrompt({ ...state, enemies: state.enemies, defending: false })
    },
    state.defending
      ? `The ${attacker.name} ${verb} — you block, taking ${appliedDamage} (HP ${nextHp}/${state.playerMaxHp}).${survivalNote}`
      : `The ${attacker.name} ${verb} and hits for ${appliedDamage} (HP ${nextHp}/${state.playerMaxHp}).${survivalNote}`
  );
}