package calculator;

// libraries used for GUI
import javax.swing.*;
import java.awt.*;
import java.awt.event.*;

public class CalculatorGUI extends JFrame implements ActionListener {
    private JTextField display;
    private BasicOperation operation = new BasicOperation();
    private boolean resetDisplay = false;

    public CalculatorGUI() {
        // window setup- sets the window title, size, exit behavior, center position, and layout manager
        setTitle("Calculator");
        setSize(350, 450);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout());

        // adds text that is uneditable to the top of the window
        display = new JTextField();
        display.setEditable(false);
        display.setFont(new Font("Courier New", Font.BOLD, 27));
        add(display, BorderLayout.NORTH);

        // creates a button grid 4 x 4 with spacing of 5 pixels
        JPanel panel = new JPanel();
        panel.setLayout(new GridLayout(4, 4, 5, 5));

        // info inside the buttons
        String[] buttons = {
            "7", "8", "9", "+",
            "4", "5", "6", "-",
            "1", "2", "3", "*",
            "C", "0", "=", "/"
        };

        // the text will display on the button
        for (String text : buttons) {
            JButton button = new JButton(text);
            button.setFont(new Font("Courier New", Font.BOLD, 20));
            button.addActionListener(this);
            panel.add(button);
        }

        add(panel, BorderLayout.CENTER);
    }

    @Override
    public void actionPerformed(ActionEvent e) {
        String command = e.getActionCommand();

        if (command.matches("[0-9]")) {
            if (resetDisplay) {
                display.setText("");
                resetDisplay = false;
            }
            display.setText(display.getText() + command);
        } else if (command.matches("[\\+\\-\\*/]")) {
            try {
                operation.setOperand1(Double.parseDouble(display.getText()));
                operation.setOperator(command);
                display.setText("");
            } catch (NumberFormatException | InvalidOperatorException ex) {
                display.setText("Error");
            }
        } else if (command.equals("=")) {
            try {
                operation.setOperand2(Double.parseDouble(display.getText()));
                double result = operation.calculate();
                display.setText(String.valueOf(result));
                System.out.println(operation.toString());
            } catch (Exception ex) {
                display.setText("Error");
            }
            resetDisplay = true;
        } else if (command.equals("C")) {
            display.setText("");
            operation = new BasicOperation();
        }
    }
}
