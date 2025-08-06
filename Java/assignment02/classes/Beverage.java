package classes;

public class Beverage {
    private String temperature;
    private int size;

    public String getTemperature() {
        return temperature;
    }

    public void setTemperature(String n) {
        if (n == "hot" || n == "cold") {
            temperature = n;
        } else {
            temperature = "room temperature";
        }
    }

    public int getSize() {
        return size;
    }

    public void setSize(int x) {
        if (x >= 0) {
            size = x;
        } else {
            size = 21;
        }
    }

    public Beverage() {
        temperature = "room temperature";
        size = 21;
    }

    public Beverage(String n, int x) {
        setTemperature(n);
        setSize(x);
    }
}