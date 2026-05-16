package testing;

import javax.swing.SwingUtilities;

import calculator.CalculatorGUI;

public class CalculatorApp {
    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            new CalculatorGUI().setVisible(true);
        });
    }
}
