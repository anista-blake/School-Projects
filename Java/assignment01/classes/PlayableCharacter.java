package classes;

public class PlayableCharacter {
    private String name, role;
    private int hp, atk, def;

    public void setName(String a) {
        name = a;
    }

    public String getName() {
        return name;
    }

    public void setRole(String a) {
        role = a;
    }

    public String getRole() {
        return role;
    }
    
    public void setHp(int n) {
        if (n > 0) hp = n;
    }

    public int getHp() {
        return hp;
    }
    
    public void setAtk(int n) {
        if (n > 0) atk = n;
    }

    public int getAtk() {
        return atk;
    }

    public void setDef(int n) {
        if (n > 0) def = n;
    }

    public int getDef() {
        return def;
    }

    public void getInfo() {
        System.out.println("Name: " + name);
        System.out.println("Class: " + role);
        System.out.println("Hp: " + hp);
        System.out.println("Atk: " + atk);
        System.out.println("Def: " + def);
        System.out.println("");
    }

    public PlayableCharacter() {
        name = "John Doe";
        role = "Jobless";
        hp = 1;
        atk = 1;
        def = 1;
    }

    public PlayableCharacter(String a, String b, int i, int j, int k) {
        name = a;
        role = b;
        hp = i;
        atk = j;
        def = k;
    }
}