package calculator;

public class InvalidOperatorException extends Exception {
    // constructor that accepts a message
    public InvalidOperatorException(String message) {
        super(message);
    }
}