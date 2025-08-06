package classes;

public class Juice extends Beverage {
    private String flavor;
    private int sugar;

    public String getFlavor() {
        return flavor;
    }

    public void setFlavor(String n) {
        flavor = n;
    }

    public int getSugar() {
        return sugar;
    }

    public void setSugar(int x) {
        if (x >= 0) {
            sugar = x;
        } else {
            sugar = 0;
        }
    }

    public Juice() {
        setFlavor("water");
        setSugar(0);
    }

    public Juice(String a, int b, String n, int x) {
        super(a, b);
        setFlavor(n);
        setSugar(x);
    }
}