import java.util.ArrayList;
import java.util.List;
import java.util.Arrays;
import java.util.Random;
import java.util.Scanner;

public class Game {
    private Player player;
    private List<Bandit> bandits = new ArrayList<>();
    private static final Random RNG = new Random();
    private enum Location { VILLAGE, OUTSIDE }
    private Location location = Location.VILLAGE;
    private boolean warnedOutside = false; // one-time outside warning
    private final String[] ambientLines = new String[] {
        "A leaf flutters by. You wonder if it suspects you of being a guard.",
        "A dog barks in the distance. You nod like a responsible guard.",
        "You hum a jaunty tune while watching the horizon. The tune helps you look stern.",
        "A villager waves. You wave back, trying to look nonchalant.",
        "A breeze ruffles your hair (or what remains of it). Very dramatic guard energy.",
        "A bird lands on the gate and stares at you. You stare back. Neither blinks.",
        "You whistle. A farmer in the distance whistles back, suspiciously off-key.",
        "You squint dramatically into the distance. It makes you feel very official.",
        "A leaf falls and lands on your boot. You scowl at it. It cowers.",
        "You practice your stern guard face in the reflection of a puddle. It applauds.",
        "A breeze carries a faint smell of stew; your stomach remembers you're a hero (and a guard)."
    };

    public Game() {
        player = new Player("Hero", 20);
        // starter gold so the player can try shops
        player.addGold(10);
    }

    public void start() {
        System.out.println("Welcome to the OOP demo game! Type 'help' for commands.");
        introScene();

        Scanner in = new Scanner(System.in);
        try {
            while (player.isAlive()) {
                // Only outside the village can raids happen
                if (location == Location.OUTSIDE && RNG.nextDouble() < 0.25) banditRaid(in);

                // Ambient outside dialogue
                if (location == Location.OUTSIDE && RNG.nextDouble() < 0.30) {
                    String a = ambientLines[RNG.nextInt(ambientLines.length)];
                    System.out.println(a);
                }

                System.out.print("> ");
                String line = in.nextLine().trim();
                if (line.isEmpty()) continue;
                String[] parts = line.split("\\s+");
                String cmd = parts[0].toLowerCase();

                switch (cmd) {
                    case "help":
                        System.out.println("commands: look, inv, equip <name>, take <weapon>, buy <item>, use <item>, status, forceraid, quit");
                        break;
                    case "look": doLook(); break;
                    case "inv":
                        System.out.println("Inventory:");
                        for (Weapon w : player.getInventory()) System.out.println(" - " + w.getName() + " (" + w.getDamage() + " dmg)");
                        System.out.println("Potions: " + player.getPotions() + ", Gold: " + player.getGold());
                        break;
                    case "take":
                        if (parts.length < 2) { System.out.println("take what?"); break; }
                        String desired = String.join(" ", Arrays.copyOfRange(parts, 1, parts.length)).toLowerCase().replace('_',' ').replace('-',' ').trim();
                        if (groundWeapon != null) {
                            String gw = groundWeapon.getName().toLowerCase().replace('_',' ').replace('-',' ').trim();
                            if (gw.equals(desired)) { player.pickUp(groundWeapon); groundWeapon = null; }
                            else System.out.println("You don't see that here.");
                        } else System.out.println("You don't see that here.");
                        break;
                    case "equip":
                        if (parts.length < 2) { System.out.println("equip what?"); break; }
                        String want = String.join(" ", Arrays.copyOfRange(parts, 1, parts.length)).toLowerCase().replace('_',' ').replace('-',' ').trim();
                        String wantNorm = want.replaceAll("[\\s_\\-]", "");
                        Weapon found = null;
                        // First look for an exact normalized match
                        for (Weapon w : player.getInventory()) {
                            String n = w.getName().toLowerCase().replaceAll("[\\s_\\-]", "");
                            if (n.equals(wantNorm)) { found = w; break; }
                        }
                        // If none exact, find the best fuzzy match (prefer longer names, e.g., 'broadsword' over 'sword')
                        if (found == null) {
                            int bestLen = -1;
                            for (Weapon w : player.getInventory()) {
                                String n = w.getName().toLowerCase().replaceAll("[\\s_\\-]", "");
                                if (n.contains(wantNorm) || wantNorm.contains(n)) {
                                    if (n.length() > bestLen) { found = w; bestLen = n.length(); }
                                }
                            }
                        }
                        if (found == null) System.out.println("No such weapon in inventory"); else player.equip(found);
                        break;
                    case "status":
                        System.out.println(player.getName() + ": " + player.getHp() + "/" + player.getMaxHp());
                        if (player.getEquipped() != null) System.out.println("Equipped: " + player.getEquipped().getName());
                        break;
                    case "forceraid": banditRaid(in); break;
                    case "enter":
                        if (parts.length < 2) { System.out.println("enter where?"); break; }
                        if (parts[1].equalsIgnoreCase("gate")) {
                            if (location == Location.VILLAGE) {
                                if (!warnedOutside) {
                                    System.out.println("You pass through the front gate and step outside the village. Be warned: bandit raids can happen here.");
                                    warnedOutside = true;
                                } else {
                                    System.out.println("You step outside again. The fields are open and quiet (for now).");
                                }
                                location = Location.OUTSIDE;
                                String a = ambientLines[RNG.nextInt(ambientLines.length)];
                                System.out.println(a);
                            } else {
                                System.out.println("You walk back through the gate into the village. You are safe here.");
                                location = Location.VILLAGE;
                            }
                        } else System.out.println("You can't enter that.");
                        break;
                    case "shop":
                        if (location != Location.VILLAGE) { System.out.println("There are no shops outside the village."); break; }
                        doShop(parts);
                        break;
                    case "buy":
                        if (location != Location.VILLAGE) { System.out.println("You can only buy items in the village."); break; }
                        if (parts.length < 2) { System.out.println("buy what? options: broadsword, potion"); break; }
                        String item = parts[1].toLowerCase();
                        if (item.equals("broadsword") || item.equals("broad_sword") || item.equals("broad-sword") || item.equals("longsword") || item.equals("long_sword") || item.equals("long-sword")) {
                            int cost = 20;
                            if (player.spendGold(cost)) player.pickUp(new Weapon("Broadsword", 8)); else System.out.println("Not enough gold.");
                        } else if (item.equals("potion") || item.equals("health_potion")) {
                            int cost = 5;
                            if (player.buyPotion(cost)) { } else System.out.println("Not enough gold.");
                        } else System.out.println("I don't recognize that item.");
                        break;
                    case "use":
                    case "drink":
                    case "potion":
                    case "u":
                        String useWhat;
                        if (parts.length < 2) {
                            if (player.getPotions() > 0) useWhat = "potion"; else { System.out.println("use what? e.g. use potion"); break; }
                        } else useWhat = parts[1].toLowerCase();
                        if (useWhat.equals("potion") || useWhat.equals("health_potion")) {
                            if (!player.usePotion()) System.out.println("You have no potions to use.");
                        } else System.out.println("You can't use that.");
                        break;
                    case "quit": System.out.println("Goodbye"); return;
                    default: System.out.println("Unknown command: " + cmd);
                }
            }
        } finally { in.close(); }

        System.out.println("You are dead. Game over.");
    }

    private void banditRaid(Scanner in) {
        int count = RNG.nextBoolean() ? 1 : 2;
        bandits.clear();
        for (int i = 0; i < count; i++) bandits.add(new Bandit("Bandit#" + (i+1), 6));

        System.out.println("A bandit raid! " + count + " bandit(s) approach!");

        while (player.isAlive() && anyBanditsAlive()) {
            renderCombatState();
            System.out.println("Choose an action: [attack <num>] [status] [run] [defend] [use potion]");
            System.out.print("combat> ");
            String line = in.nextLine().trim();
            if (line.isEmpty()) continue;
            String[] parts = line.split("\\s+");
            String cmd = parts[0].toLowerCase();

            if (cmd.equals("attack")) {
                if (parts.length < 2) { System.out.println("attack which bandit? e.g. attack 1"); continue; }
                int idx;
                try { idx = Integer.parseInt(parts[1]) - 1; } catch (NumberFormatException e) { System.out.println("invalid number"); continue; }
                if (idx < 0 || idx >= bandits.size()) { System.out.println("no such bandit"); continue; }
                Bandit target = bandits.get(idx);
                if (!target.isAlive()) { System.out.println(target.getName() + " is already down."); continue; }

                int dmg = player.attack();
                System.out.println(player.getName() + " attacks " + target.getName() + " for " + dmg);
                target.receiveDamage(dmg);
                if (!target.isAlive()) { System.out.println(target.getName() + " collapses!"); player.addGold(5); }

                List<Bandit> alive = new ArrayList<>();
                for (Bandit b2 : bandits) if (b2.isAlive()) alive.add(b2);
                if (!alive.isEmpty()) {
                    Bandit attacker = alive.get(RNG.nextInt(alive.size()));
                    int bd = attacker.attack();
                    System.out.println(attacker.getName() + " retaliates for " + bd + " damage.");
                    player.receiveDamage(bd);
                }

            } else if (cmd.equals("status")) {
                renderCombatState();
            } else if (cmd.equals("use") || cmd.equals("drink")) {
                if (parts.length < 2) { System.out.println("use what? e.g. use potion"); continue; }
                String what = parts[1].toLowerCase();
                if (what.equals("potion") || what.equals("health_potion")) {
                    if (!player.usePotion()) System.out.println("You have no potions to use.");
                    else {
                        List<Bandit> alive4 = new ArrayList<>();
                        for (Bandit b2 : bandits) if (b2.isAlive()) alive4.add(b2);
                        if (!alive4.isEmpty()) {
                            Bandit attacker = alive4.get(RNG.nextInt(alive4.size()));
                            int bd = attacker.attack();
                            System.out.println(attacker.getName() + " attacks while you use the potion for " + bd + " damage.");
                            player.receiveDamage(bd);
                        }
                    }
                } else System.out.println("You can't use that in combat.");
            } else if (cmd.equals("defend")) {
                player.defend();
                List<Bandit> alive2 = new ArrayList<>();
                for (Bandit b2 : bandits) if (b2.isAlive()) alive2.add(b2);
                if (!alive2.isEmpty()) {
                    Bandit attacker = alive2.get(RNG.nextInt(alive2.size()));
                    int bd = attacker.attack();
                    System.out.println(attacker.getName() + " attacks while you defend for " + bd + " damage.");
                    player.receiveDamage(bd);
                }
            } else if (cmd.equals("run")) {
                System.out.println("You attempt to run away...");
                if (RNG.nextDouble() < 0.5) { System.out.println("You escape!"); return; }
                else {
                    System.out.println("You fail to escape. A single bandit attacks!");
                    List<Bandit> alive3 = new ArrayList<>();
                    for (Bandit b2 : bandits) if (b2.isAlive()) alive3.add(b2);
                    if (!alive3.isEmpty()) player.receiveDamage(alive3.get(RNG.nextInt(alive3.size())).attack());
                }
            } else System.out.println("Unknown combat command: " + cmd);
        }
    }

    private boolean anyBanditsAlive() { for (Bandit b : bandits) if (b.isAlive()) return true; return false; }

    private void introScene() {
        System.out.println("You wake up on a straw mattress in the town guard barracks. Sunlight filters through the window.");
        System.out.println("You're the on-duty guard today. Next to you lies a short sword on the bed.");
        System.out.println("You get up and look around. There are vendors in the town square: a weapons vendor and a potion seller.");
        System.out.println("Walk to the gate to go outside where bandit raids can occur (and where your watch truly begins).");
        groundWeapon = new Weapon("sword", 4);
    }

    private Weapon groundWeapon = null;

    private void doLook() {
        if (location == Location.VILLAGE) {
            System.out.println("You are in the village. You see:");
            if (groundWeapon != null) System.out.println(" - A " + groundWeapon.getName() + " lying near the bed.");
            System.out.println(" - A weapons vendor (type 'shop weapons' to browse)");
            System.out.println(" - A potion seller (type 'shop potions' to browse)");
            System.out.println(" - The front gate to the outside (type 'enter gate' to leave)");
        } else {
            System.out.println("You are outside the village. The fields are quiet, but dangerous.");
            if (ambientLines != null && ambientLines.length > 0) System.out.println(ambientLines[RNG.nextInt(ambientLines.length)]);
        }
    }

    private void doShop(String[] parts) {
        if (parts.length < 2) { System.out.println("shop what? 'shop weapons' or 'shop potions'"); return; }
        String which = parts[1].toLowerCase();
        if (which.equals("weapons")) {
            System.out.println("Weapons vendor: sells a Broadsword (8 dmg) for 20 gold. Type 'buy broadsword' to purchase.");
            if (parts.length >= 3) {
                String want = parts[2].toLowerCase();
                if (want.equals("broadsword") || want.equals("broad_sword") || want.equals("broad-sword") || want.equals("longsword") || want.equals("long_sword") || want.equals("long-sword")) {
                    if (player.spendGold(20)) { player.pickUp(new Weapon("Broadsword", 8)); } else System.out.println("Not enough gold.");
                }
            }
        } else if (which.equals("potions")) {
            System.out.println("Potion seller: health potion (heals 8) for 5 gold. Type 'buy potion' to purchase.");
            if (parts.length >= 3 && parts[2].equalsIgnoreCase("potion")) {
                if (player.spendGold(5)) { player.buyPotion(0); System.out.println("You buy a potion."); } else System.out.println("Not enough gold.");
            }
        } else System.out.println("Unknown shop: " + which);
    }

    private void renderCombatState() {
        System.out.println();
        System.out.println("PLAYER: " + player.getName());
        System.out.println(healthBar(player.getHp(), player.getMaxHp()));
        System.out.println();

        for (int i = 0; i < bandits.size(); i++) System.out.print(String.format("  [%d] %s    ", i+1, bandits.get(i).getName()));
        System.out.println();
        for (Bandit b : bandits) System.out.print(healthBar(b.getHp(), b.getMaxHp()) + "   ");
        System.out.println();
        System.out.println();
    }

    private String healthBar(int hp, int max) {
        int width = 20;
        int filled = (int)Math.round(((double)hp / max) * width);
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        for (int i = 0; i < width; i++) sb.append(i < filled ? "#" : " ");
        sb.append("] ");
        sb.append(hp).append("/").append(max);
        return sb.toString();
    }

    public static void main(String[] args) { new Game().start(); }
}
