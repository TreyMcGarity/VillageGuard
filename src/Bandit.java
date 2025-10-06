import java.util.Random;

public class Bandit extends Entity {
    private static final Random RNG = new Random();

    public Bandit(String name, int maxHp) {
        super(name, maxHp);
    }

    @Override
    public int attack() {
        // Bandit does 1-4 damage randomly
        return RNG.nextInt(4) + 1;
    }
}
