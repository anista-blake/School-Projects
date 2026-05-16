package calculator;

/* added abstract */
public abstract class Operation{

    // base attributes (operands and operator)
    private double operand1;
    private double operand2;
    private String operator; // will use verb rather than noun "divide" not "division"

    // accessor for operand1
    public double getOperand1(){
        return operand1;
    }

    /*changed accessot to accessor */
    // accessor for operand 2
    public double getOperand2(){
        return operand2;
    }

    // accessor for operator
    public String getOperator(){
        return operator;
    }

    // mutator for operand 1
    public void setOperand1(double o1){
        operand1 = o1;
    }

    // mutator for operand 2
    public void setOperand2(double o2){
        operand2 = o2; /* changed 02 to o2 */
    }

    // mutator for operator w/ business rule applied
    /* added throws to setOperator because we are using a checked exception */
    public void setOperator(String op) throws InvalidOperatorException {
        /* changed operation to op because of (String op) 
        also changed sum to +, subtract to -, etc to make GUI connection a little bit more easier
        Original:
        if (operator.equals("add") || operator.equals("subtract") || 
            operator.equals("multiply") || operator.equals("divide")){
                operator = op;
        */
        
        if (op.equals("+") || op.equals("-") || 
            op.equals("*") || op.equals("/")){
                operator = op;
        } else{
            // something here to complete business rule
            /* added the throw keyword */
            throw new InvalidOperatorException("Invalid operator: " + op);
        }
    }
         /* to force subclasses to implement this*/
    public abstract double calculate();

    
    @Override
    public String toString() {
        return "Operation: " + operand1 + " " + operator + " " + operand2;
    }
    
}
