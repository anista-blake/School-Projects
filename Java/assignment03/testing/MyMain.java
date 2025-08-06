package testing;

import classes.CSEvent;

public class MyMain {
    public static void main(String[] args) {
        CSEvent test_01 = new CSEvent();
        System.out.println(test_01.toString());

        test_01.setName("Class");
        test_01.setDescription("Self-explanatory");
        test_01.getEventDateTime().setDay(6);
        test_01.getEventDateTime().setMonth(3);
        test_01.getEventDateTime().setYear(2025);
        test_01.getEventDateTime().setHours(9);
        test_01.getEventDateTime().setMinutes(30);

        System.out.println(test_01.toString());
    }
}
