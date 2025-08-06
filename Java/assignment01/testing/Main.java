package testing;

import classes.PlayableCharacter;

public class Main {
    public static void main(String[] args) {
        PlayableCharacter pc01 = new PlayableCharacter();
        pc01.getInfo();
        pc01.setRole("Student");
        System.out.println("New Class for p01: " + pc01.getRole() + "\n");

        PlayableCharacter pc02 = new PlayableCharacter("Naia", "Water Mage", 23, 7, 16);
        pc02.setAtk(0);
        System.out.println("New Atk stat for p02: " + pc02.getAtk() + "\n");
        pc02.getInfo();
    }
}