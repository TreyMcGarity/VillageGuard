import java.util.ArrayList;
import java.util.List;

public class Player extends Entity {
    private List<Weapon> inventory = new ArrayList<>();
    private Weapon equipped;
    private boolean defending = false;
    private int gold = 0;
    private int potions = 0;

    public Player(String name, int maxHp) {
        super(name, maxHp);
    }

    public void pickUp(Weapon w) {
        inventory.add(w);
        System.out.println(getName() + " picks up " + w.getName());
        if (equipped == null) {
            equip(w);
        }
    }

    public void equip(Weapon w) {
        if (!inventory.contains(w)) {
            System.out.println(w.getName() + " is not in inventory");
            return;
        }
        equipped = w;
        System.out.println(getName() + " equips " + w.getName());
    }

    public Weapon getEquipped() { return equipped; }

    // Provide read-only access to inventory for other systems (keeps encapsulation)
    public java.util.List<Weapon> getInventory() {
        return java.util.Collections.unmodifiableList(inventory);
    }

    // Defend for one incoming attack (halves damage)
    public void defend() {
        this.defending = true;
        System.out.println(getName() + " is defending (next hit will be reduced)");
    }

    public boolean isDefending() { return defending; }

    @Override
    public void receiveDamage(int amount) {
        if (defending) {
            amount = (amount + 1) / 2; // round up half
            System.out.println(getName() + " reduces the incoming damage by defending.");
            defending = false;
        }
        super.receiveDamage(amount);
    }

    // Currency and potions
    public int getGold() { return gold; }
    public void addGold(int g) { gold += g; System.out.println(getName() + " receives " + g + " gold (" + gold + " total)"); }

    public int getPotions() { return potions; }
    public boolean buyPotion(int cost) {
        if (gold < cost) return false;
        gold -= cost;
        potions++;
        System.out.println(getName() + " buys a potion. Potions: " + potions + ", Gold: " + gold);
        return true;
    }

    public boolean usePotion() {
        if (potions <= 0) return false;
        potions--;
        int heal = 8;
        heal(heal);
        System.out.println(getName() + " uses a health potion and heals " + heal + " HP.");
        return true;
    }

    public void heal(int amount) {
        healAmount(amount);
    }

    public boolean spendGold(int cost) {
        if (gold < cost) return false;
        gold -= cost;
        return true;
    }

    @Override
    public int attack() {
        if (equipped == null) return 1; // unarmed
        return equipped.rollDamage();
    }
}
