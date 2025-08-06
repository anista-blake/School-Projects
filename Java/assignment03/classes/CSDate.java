package classes;

public class CSDate {
    private int day;
    private int month;
    private int year;

    public void setDay(int d) {
        if (d >= 1 && d <= 31) {
            day = d;
        }
    }

    public int getDay() {
        return day;
    }

    public void setMonth(int m) {
        if (m >= 1 && m <= 12) {
            month = m;
        }
    }

    public int getMonth() {
        return month;
    }

    public String getMonthName() {
        String[] monthArr = {"January", "February", "March", "April", "May", "June", "July", 
                             "August", "September", "October", "November", "December"};
        return monthArr[month - 1];
    }

    public void setYear(int y) {
        if (y >= 1800 && y <= 2025) {
            year = y;
        }
    }

    public int getYear() {
        return year;
    }

    public CSDate() {
        day = 1;
        month = 1;
        year = 1800;
    }

    public CSDate(int d, int m, int y) {
        if (m >= 1 && m <= 12) {
            month = m;
        } else {month = 1;}

        if (d >= 1 && d <= 31) {
            if (d > 28 && m == 2) {
                day = 1;
            } else if (d > 30 && (m == 4 || m == 6 || m == 9 || m == 11)) {
                day = 1;
            } else {day = d;}
        } else {day = 1;}

        if (y >= 1800 && y <= 2025) {
            year = y;
        } else {year = 1800;}
    }
}