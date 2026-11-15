console.log("Math Scientia is running!");

// Get the Addition button
const additionButton = document.getElementById("addition");

// Get workspace elements
const workspace = document.getElementById("math-workspace");
const workspaceTitle = document.getElementById("workspace-title");
const workspaceContent = document.getElementById("workspace-content");

// Listen for Addition button clicks
additionButton.addEventListener("click", function() {

    // Show the workspace
    workspace.classList.remove("hidden");
    workspaceTitle.textContent = "Addition";

    // Create the four input fields
    workspaceContent.innerHTML = `
        <h3>Enter Your Numbers</h3>

        <div class="number-inputs">

            <div>
                <label for="number-one">Number 1</label>
                <input type="text" id="number-one"
                    inputmode="decimal" placeholder="Number 1">
            </div>

            <div>
                <label for="number-two">Number 2</label>
                <input type="text" id="number-two"
                    inputmode="decimal" placeholder="Number 2">
            </div>

            <div>
                <label for="number-three">Number 3</label>
                <input type="text" id="number-three"
                    inputmode="decimal" placeholder="Number 3">
            </div>

            <div>
                <label for="number-four">Number 4</label>
                <input type="text" id="number-four"
                    inputmode="decimal" placeholder="Number 4">
            </div>

        </div>

        <button type="button" id="solve-button">Solve</button>

        <div id="answer-display"></div>
    `;

    // Get the Solve button
    const solveButton = document.getElementById("solve-button");

    // Listen for Solve button clicks
    solveButton.addEventListener("click", function() {

        const answerDisplay = document.getElementById("answer-display");

        // Collect all four numbers
        const numbers = [
            document.getElementById("number-one").value.trim(),
            document.getElementById("number-two").value.trim(),
            document.getElementById("number-three").value.trim(),
            document.getElementById("number-four").value.trim()
        ].filter(number => number !== "");

        // Require at least two numbers
        if (numbers.length < 2) {
            answerDisplay.textContent =
                "Please enter at least two numbers.";
            return;
        }

        // Validate the numbers
        const numberPattern = /^-?\d+(\.\d+)?$/;

        if (!numbers.every(number => numberPattern.test(number))) {
            answerDisplay.textContent =
                "Please enter valid positive numbers.";
            return;
        }

        // Find the longest decimal portion
        const decimalPlaces = Math.max(
            ...numbers.map(number =>
                (number.split(".")[1] || "").length
            )
        );

        // Find the longest whole-number portion
        const wholePlaces = Math.max(
            ...numbers.map(number =>
                number.split(".")[0].length
            )
        );

        // Align all numbers
        const alignedNumbers = numbers.map(number => {

            const parts = number.split(".");

            const whole = parts[0].padStart(wholePlaces, "0");

            const decimal = (parts[1] || "")
                .padEnd(decimalPlaces, "0");

            return whole + decimal;

        });

        // Calculate each column from right to left
        let carry = 0;
        let columns = [];

        const totalPlaces = wholePlaces + decimalPlaces;

        for (let i = totalPlaces - 1; i >= 0; i--) {

            // Collect digits from all numbers
            const digits = alignedNumbers.map(number =>
                Number(number[i])
            );

            const carryIn = carry;

            // Add all digits and the previous carry
            const columnTotal = digits.reduce(
                (total, digit) => total + digit,
                carryIn
            );

            const resultDigit = columnTotal % 10;

            const carryOut = Math.floor(columnTotal / 10);

            columns.push({
                digits,
                carryIn,
                columnTotal,
                resultDigit,
                carryOut
            });

            carry = carryOut;
        }

        // Build the answer
        let answerDigits = columns
            .map(column => column.resultDigit)
            .reverse()
            .join("");

        // Add any remaining carry
        if (carry > 0) {
            answerDigits = String(carry) + answerDigits;
        }

        // Separate whole and decimal portions
        let answerWhole = answerDigits;
        let answerDecimal = "";

        if (decimalPlaces > 0) {

            answerWhole = answerDigits.slice(0, -decimalPlaces);

            answerDecimal = answerDigits.slice(-decimalPlaces);

            answerWhole = answerWhole.replace(/^0+(?=\d)/, "");

            answerDecimal = answerDecimal.replace(/0+$/, "");

        } else {

            answerWhole = answerDigits.replace(/^0+(?=\d)/, "");

        }

        let answer = answerWhole || "0";

        if (answerDecimal) {
            answer += "." + answerDecimal;
        }

        // Prepare the vertical problem
        const displayWidth = Math.max(
            totalPlaces,
            answerDigits.length
        );

        // Create a row of aligned digits
        function createDisplayRow(digitString) {

            const padded = digitString.padStart(displayWidth, "0");

            let cells = "";

            for (let i = 0; i < displayWidth; i++) {

                if (
                    decimalPlaces > 0 &&
                    i === displayWidth - decimalPlaces
                ) {
                    cells += `<td class="decimal-point">.</td>`;
                }

                cells += `<td>${padded[i]}</td>`;
            }

            return cells;
        }

        // Display carrying digits
        let carryCells = Array(displayWidth).fill("");

        columns.forEach((column, index) => {

            const position = displayWidth - 1 - index;

            if (column.carryIn > 0) {
                carryCells[position] = column.carryIn;
            }

        });

        let carryRow = "";

        carryCells.forEach((digit, index) => {

            if (
                decimalPlaces > 0 &&
                index === displayWidth - decimalPlaces
            ) {
                carryRow += `<td class="decimal-point">.</td>`;
            }

            carryRow += `<td>${digit}</td>`;

        });

        // Build the vertical addition problem
        let verticalProblem = `
            <h3>Let's Work It Out!</h3>

            <table class="addition-table">
                <tbody>

                    <tr class="carry-row">
                        <td class="sign"></td>
                        ${carryRow}
                    </tr>
        `;

        // Display every number entered
        numbers.forEach((number, index) => {

            verticalProblem += `
                <tr>
                    <td class="sign">
                        ${index === numbers.length - 1 ? "+" : ""}
                    </td>

                    ${createDisplayRow(alignedNumbers[index])}
                </tr>
            `;

        });

        // Display the answer row
        verticalProblem += `
                    <tr class="answer-row">
                        <td class="sign"></td>
                        ${createDisplayRow(answerDigits)}
                    </tr>

                </tbody>
            </table>
        `;

        // Place value names
        const placeNames = [
            "Ones",
            "Tens",
            "Hundreds",
            "Thousands",
            "Ten-thousands",
            "Hundred-thousands",
            "Millions",
            "Ten-millions",
            "Hundred-millions",
            "Billions"
        ];

        const decimalNames = [
            "Tenths",
            "Hundredths",
            "Thousandths",
            "Ten-thousandths",
            "Hundred-thousandths",
            "Millionths"
        ];

        // Generate step-by-step explanations
        let stepsHTML = "<h3>Step-by-Step Instructions</h3>";

        let stepNumber = 1;

        // Process columns from right to left
        for (let i = 0; i < columns.length; i++) {

            const column = columns[i];

            let placeName;

            if (i < decimalPlaces) {

              const decimalPosition = decimalPlaces - 1 - i;

              placeName = decimalNames[decimalPosition] ||
               `Decimal place ${decimalPosition + 1}`;

            } else {

               const integerPosition = i - decimalPlaces;

               placeName = placeNames[integerPosition] ||
                 `Integer place ${integerPosition + 1}`;

}

            // Build the calculation for this column
            let calculation = column.digits.join(" + ");

            if (column.carryIn > 0) {
                calculation += " + " + column.carryIn;
            }

            // Explain the calculation
            stepsHTML += `
                <div class="addition-step">

                    <h4>Step ${stepNumber}: ${placeName} Column</h4>

                    <p>
                        ${calculation} = ${column.columnTotal}
                    </p>

                    <p>
                        Write down
                        <strong>${column.resultDigit}</strong>.

                        ${
                            column.carryOut > 0
                            ? `Carry the <strong>${column.carryOut}</strong>
                               into the next column to the left.`
                            : "There is no carry to the next column."
                        }
                    </p>

                </div>
            `;

            stepNumber++;
        }

        // Explain any remaining carry
        if (carry > 0) {

            stepsHTML += `
                <div class="addition-step">
                    <h4>Final Carry</h4>
                    <p>Bring down the remaining ${carry}.</p>
                </div>
            `;
        }

        // Display the complete solution
        answerDisplay.innerHTML = `

            <div class="vertical-problem">
                ${verticalProblem}
            </div>

            <div class="step-explanations">
                ${stepsHTML}
            </div>

            <div class="final-answer">
                <h3>Final Answer</h3>
                <h2>${answer}</h2>
            </div>

        `;

    });

});
