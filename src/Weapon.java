public class Weapon {
    private final String name;
    private final int damage;

    public Weapon(String name, int damage) {
        this.name = name;
        this.damage = damage;
    }

    public String getName() { return name; }
    public int getDamage() { return damage; }

    // Compile-time polymorphism example — overloaded method
    public int rollDamage() { return damage; }
    public int rollDamage(boolean critical) { return critical ? damage * 2 : damage; }
}
