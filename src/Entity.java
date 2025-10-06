public abstract class Entity implements Attackable {
    private final String name;
    private final int maxHp;
    private int hp;

    public Entity(String name, int maxHp) {
        this.name = name;
        this.maxHp = maxHp;
        this.hp = maxHp;
    }

    public String getName() { return name; }
    public int getHp() { return hp; }
    public int getMaxHp() { return maxHp; }
    public boolean isAlive() { return hp > 0; }

    // Abstraction: subclasses must implement how they attack
    public abstract int attack();

    @Override
    public void receiveDamage(int amount) {
        hp -= amount;
        if (hp < 0) hp = 0;
    }

    // Protected helper to heal or set HP from subclasses
    protected void setHp(int newHp) { this.hp = Math.max(0, Math.min(newHp, maxHp)); }
    protected void healAmount(int amount) { setHp(this.hp + amount); }
}
