def calculate(a, operator, b):

    if operator == "+":
        return a + b

    elif operator == "-":
        return a - b

    elif operator == "*":
        return a * b

    elif operator == "/":

        if b == 0:
            return "Cannot divide by Zero!!"

        return a / b

    else:
        return "Invalid operation"