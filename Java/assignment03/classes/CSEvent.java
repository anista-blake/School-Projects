package classes;

public class CSEvent {
    private String name;
    private String description;
    private CSDateTime eventDate;

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public CSDateTime getEventDateTime() {
        return eventDate;
    }

    public void setName(String n) {
        name = n;
    }

    public void setDescription(String d) {
        description = d;
    }

    @Override
    public String toString() {
        return ("[" + getName() + "]\n" + getDescription() + "\n" + getEventDateTime().toString() + "\n");
    }
    
    public CSEvent() {
        name = "Unknown";
        description = "";
        eventDate = new CSDateTime();
    }
    
    public CSEvent(String n, String d, int day, int m, int y, int h, int min) {
        if (n == "") {
            name = "Unknown";
        } else {name = n;}

        description = d;
        
        eventDate = new CSDateTime(day, m, y, h, min);
    }
}
