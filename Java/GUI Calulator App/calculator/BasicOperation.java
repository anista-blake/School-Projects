package calculator;

public class BasicOperation extends Operation {

    @Override
    //implements the calculate() method
    public double calculate() {
        //getters
        double op1 = getOperand1();
        double op2 = getOperand2();
        String operator = getOperator();
        
        //switch case for basic arithmetic operations
        switch (operator) {
            case "+": 
                return op1 + op2;
            case "-": 
                return op1 - op2;
            case "*": 
                return op1 * op2;
            case "/":
                //deals with division by zero
                if (op2 != 0) {
                    return op1 / op2;
                } else {
                    throw new ArithmeticException("Dividing by 0");
                }
            //throws an exception for an invalid or unknown operator
            default:
                throw new IllegalStateException("Operation is Unknown");
        }
    }
}
