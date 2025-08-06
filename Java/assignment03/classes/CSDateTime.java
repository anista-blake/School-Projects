package classes;

public class CSDateTime extends CSDate {
    private int hours;
    private int minutes;

    public int getHours() {
        return hours;
    }

    public int getMinutes() {
        return minutes;
    }

    public void setHours(int h) {
        if (h >= 0 && h <= 23) {
            hours = h;
        }
    }

    public void setMinutes(int m) {
        if (m >= 0 && m <= 59) {
            minutes = m;
        }
    }

    @Override
    public String toString() {
        return (getMonth() + "/" + getDay() + "/" + getYear() 
                + " " + getHours() + ":" + getMinutes());
    }

    public CSDateTime() {
        super();
        hours = 0;
        minutes = 0;
    }

    public CSDateTime(int d, int m, int y, int h, int min) {
        super(d, m, y);

        if (h >= 0 && h <= 23) {
            hours = h;
        } else {hours = 0;}

        if (min >= 0 && min <= 59) {
            minutes = min;
        } else {minutes = 0;}
    }
}
