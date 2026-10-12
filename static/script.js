let justCalculated = false;

// Load saved history from the browser
let history = [];

try {
    const savedHistory = localStorage.getItem("calculatorHistory");
    const parsedHistory = JSON.parse(savedHistory);

    if (
        Array.isArray(parsedHistory) &&
        parsedHistory.every(item => typeof item === "string")
    ) {
        history = parsedHistory;
    }
} catch (error) {
    console.error("Could not load calculation history:", error);
}


// Add a number or operator to the display
function addToDisplay(value) {
    const display = document.getElementById("display");

    // Start a new calculation after a result
    if (justCalculated) {
        display.value = "";
        justCalculated = false;
    }

    display.value += value;
}


// Calculate the answer using Flask
async function calculateResult() {
    const display = document.getElementById("display");
    const expression = display.value;

    if (expression === "") {
        return;
    }

    // Find the operator
    let operator = "";

    if (expression.includes("+")) {
        operator = "+";
    } else if (expression.includes("-")) {
        operator = "-";
    } else if (expression.includes("*")) {
        operator = "*";
    } else if (expression.includes("/")) {
        operator = "/";
    } else {
        display.value = "Invalid";
        justCalculated = true;
        return;
    }

    // Split into two numbers
    const parts = expression.split(operator);

    if (
        parts.length !== 2 ||
        parts[0].trim() === "" ||
        parts[1].trim() === ""
    ) {
        display.value = "Invalid";
        justCalculated = true;
        return;
    }

    const a = parts[0].trim();
    const b = parts[1].trim();

    // Validate the numbers
    if (
        !Number.isFinite(Number(a)) ||
        !Number.isFinite(Number(b))
    ) {
        display.value = "Invalid";
        justCalculated = true;
        return;
    }

    // Build URL parameters safely
    const params = new URLSearchParams({
        a: a,
        operator: operator,
        b: b
    });

    try {
        // Send the request to Flask
        const response = await fetch(`/calculate?${params}`);

        const answer = await response.text();

        // Handle server-side validation errors
        if (!response.ok) {
            display.value = answer || "Error";
            justCalculated = true;
            return;
        }

        // Display the answer
        display.value = answer;
        justCalculated = true;

        // Save successful calculations in history
        addToHistory(a, operator, b, answer);

    } catch (error) {
        display.value = "Connection error";
        justCalculated = true;

        console.error("Calculation error:", error);
    }
}


// Clear the calculator display
function clearDisplay() {
    document.getElementById("display").value = "";
    justCalculated = false;
}


// Delete the last character
function deleteLast() {
    const display = document.getElementById("display");

    display.value = display.value.slice(0, -1);
    justCalculated = false;
}


// Add a calculation to history
function addToHistory(a, operator, b, answer) {
    const calculation = `${a} ${operator} ${b} = ${answer}`;

    history.push(calculation);

    // Save history in browser storage
    try {
        localStorage.setItem(
            "calculatorHistory",
            JSON.stringify(history)
        );
    } catch (error) {
        console.error("Could not save calculation history:", error);
    }

    displayHistory();
}


// Display history, newest first
function displayHistory() {
    const historyList = document.getElementById("history-list");

    historyList.innerHTML = "";

    if (history.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "No calculations yet.";
        historyList.appendChild(emptyMessage);
        return;
    }

    for (let i = history.length - 1; i >= 0; i--) {
        const item = document.createElement("p");

        // textContent displays text without interpreting it as HTML
        item.textContent = history[i];

        historyList.appendChild(item);
    }
}


// Clear all calculation history
function clearHistory() {
    history = [];

    try {
        localStorage.removeItem("calculatorHistory");
    } catch (error) {
        console.error("Could not clear saved history:", error);
    }

    displayHistory();
}


// Restore history when the page loads
displayHistory();


// Keyboard support
document.addEventListener("keydown", function (event) {

    // Avoid triggering calculator shortcuts while typing elsewhere
    if (
        event.target instanceof HTMLElement &&
        (
            event.target.isContentEditable ||
            ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)
        )
    ) {
        return;
    }

    // Numbers
    if (/^[0-9]$/.test(event.key)) {
        addToDisplay(event.key);
    }

    // Operators
    else if (["+", "-", "*", "/"].includes(event.key)) {
        addToDisplay(event.key);
    }

    // Decimal point
    else if (event.key === ".") {
        addToDisplay(".");
    }

    // Enter calculates
    else if (event.key === "Enter" || event.key === "=") {
        event.preventDefault();
        calculateResult();
    }

    // Backspace deletes the last character
    else if (event.key === "Backspace") {
        event.preventDefault();
        deleteLast();
    }

    // Escape clears the display
    else if (event.key === "Escape") {
        clearDisplay();
    }
});