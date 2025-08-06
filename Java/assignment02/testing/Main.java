package testing;

import classes.Beverage;
import classes.Juice;

public class Main {
    public static void main(String[] args) {
        Beverage glass1 = new Beverage();
        System.out.println("glass 1's temperature: " + glass1.getTemperature());
        glass1.setSize(0);
        System.out.println("glass 1 contains " + glass1.getSize() + " fluid ounces of liquid!");

        Juice glass2 = new Juice("cold", 16, "Apple", 48);
        System.out.println("glass 2's temperature: " + glass2.getTemperature());
        glass2.setSugar(0);
        System.out.println("glass 2 cotnains " + glass2.getSugar() + " grams of sugar!");
    }
}