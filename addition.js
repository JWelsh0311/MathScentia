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

        const answerDisplay =
            document.getElementById("answer-display");

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

        // Validate positive and negative numbers
        const numberPattern = /^-?\d+(\.\d+)?$/;

        if (!numbers.every(number => numberPattern.test(number))) {
            answerDisplay.textContent =
                "Please enter valid positive or negative numbers.";
            return;
        }

        // ==================================================
        // NEGATIVE NUMBER CALCULATION
        // ==================================================

        if (numbers.some(number => number.startsWith("-"))) {

            // Find the maximum decimal places
            const decimalPlaces = Math.max(
                ...numbers.map(number =>
                    (number.split(".")[1] || "").length
                )
            );

            // Convert numbers into scaled integers
            function toScaledInteger(number) {

                const negative = number.startsWith("-");

                const unsigned = negative
                    ? number.slice(1)
                    : number;

                const parts = unsigned.split(".");

                const whole = parts[0];

                const decimal = (parts[1] || "")
                    .padEnd(decimalPlaces, "0");

                const value = BigInt(whole + decimal);

                return negative ? -value : value;
            }

            // Convert all entered numbers
            const values = numbers.map(toScaledInteger);

            // Format numbers for display
            function formatNumber(value) {

                const negative = value < 0n;

                const absolute = negative ? -value : value;

                let digits = absolute.toString();

                if (decimalPlaces > 0) {

                    digits = digits.padStart(
                        decimalPlaces + 1, "0"
                    );

                    const whole = digits.slice(
                        0, -decimalPlaces
                    );

                    let decimal = digits.slice(
                        -decimalPlaces
                    );

                    decimal = decimal.replace(/0+$/, "");

                    digits = decimal
                        ? whole + "." + decimal
                        : whole;
                }

                return (negative ? "-" : "") + digits;
            }

            // Get the name of a column
            function getPlaceName(position) {

                const decimalNames = [
                    "Tenths",
                    "Hundredths",
                    "Thousandths",
                    "Ten-thousandths",
                    "Hundred-thousandths",
                    "Millionths"
                ];

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

                if (position < decimalPlaces) {

                    return decimalNames[
                        decimalPlaces - 1 - position
                    ] || "Decimal place";

                }

                return placeNames[
                    position - decimalPlaces
                ] || "Integer place";
            }

            // ==================================================
            // COLUMN-BY-COLUMN CALCULATION
            // ==================================================

            function calculateColumns(first, second, operation) {

                // Create aligned digit arrays
                const width = Math.max(
                    first.toString().length,
                    second.toString().length,
                    decimalPlaces + 1
                ) + 1;

                const originalTop = first.toString()
                    .padStart(width, "0")
                    .split("")
                    .map(Number);

                const bottomDigits = second.toString()
                    .padStart(width, "0")
                    .split("")
                    .map(Number);

                // Keep a separate copy for borrowing
                const topDigits = [...originalTop];

                const resultDigits = Array(width).fill(0);

                const columns = [];

                let carry = 0;

                // Work from right to left
                for (let i = width - 1; i >= 0; i--) {

                    const borrowEvents = [];

                    const topBefore = topDigits[i];

                    const bottomDigit = bottomDigits[i];

                    // ------------------------------------------
                    // SUBTRACTION AND BORROWING
                    // ------------------------------------------

                    if (operation === "subtract") {

                        // Check whether borrowing is necessary
                        if (topDigits[i] < bottomDigit) {

                            // Find the next column to the left
                            let donor = i - 1;

                            while (
                                donor >= 0 &&
                                topDigits[donor] === 0
                            ) {
                                donor--;
                            }

                            if (donor < 0) {
                                throw new Error(
                                    "Unable to complete borrowing."
                                );
                            }

                            // Reduce the donating digit by 1
                            const donorBefore = topDigits[donor];

                            topDigits[donor]--;

                            borrowEvents.push({
                                type: "donor",
                                position: width - 1 - donor,
                                before: donorBefore,
                                after: topDigits[donor]
                            });

                            // Change any zeros between columns
                            for (
                                let j = donor + 1;
                                j < i;
                                j++
                            ) {

                                const before = topDigits[j];

                                topDigits[j] = 9;

                                borrowEvents.push({
                                    type: "middle",
                                    position: width - 1 - j,
                                    before,
                                    after: 9
                                });
                            }

                            // Add 10 to the current column
                            topDigits[i] += 10;

                            borrowEvents.push({
                                type: "current",
                                position: width - 1 - i,
                                before: topBefore,
                                after: topDigits[i]
                            });
                        }

                        // Perform the subtraction
                        const resultDigit =
                            topDigits[i] - bottomDigit;

                        resultDigits[i] = resultDigit;

                        columns.push({
                            position: width - 1 - i,
                            topBefore,
                            topAfter: topDigits[i],
                            bottomDigit,
                            resultDigit,
                            borrowEvents
                        });
                    }

                    // ------------------------------------------
                    // ADDITION AND CARRYING
                    // ------------------------------------------

                    else {

                        const carryIn = carry;

                        const columnTotal =
                            topDigits[i] +
                            bottomDigit +
                            carryIn;

                        const resultDigit = columnTotal % 10;

                        const carryOut =
                            Math.floor(columnTotal / 10);

                        resultDigits[i] = resultDigit;

                        columns.push({
                            position: width - 1 - i,
                            topBefore,
                            topAfter: topDigits[i],
                            bottomDigit,
                            carryIn,
                            columnTotal,
                            resultDigit,
                            carryOut
                        });

                        carry = carryOut;
                    }
                }

                // Build the final calculated value
                const resultString = resultDigits
                    .join("")
                    .replace(/^0+(?=\d)/, "");

                return {
                    originalTop,
                    topDigits,
                    bottomDigits,
                    resultDigits,
                    columns,
                    result: BigInt(resultString || "0"),
                    width
                };
            }

            // ==================================================
            // DISPLAY THE VERTICAL CALCULATION
            // ==================================================

            function createColumnTable(calculation, operation) {

                const {
                    originalTop,
                    topDigits,
                    bottomDigits,
                    resultDigits,
                    width,
                    columns
                } = calculation;

                // Build a row of aligned digits
                function createRow(digits) {

                    let cells = "";

                    for (let i = 0; i < width; i++) {

                        if (
                            decimalPlaces > 0 &&
                            i === width - decimalPlaces
                        ) {
                            cells += `
                                <td class="decimal-point">.</td>
                            `;
                        }

                        cells += `<td>${digits[i]}</td>`;
                    }

                    return cells;
                }

                // Show the original number
                let table = `
                    <table class="addition-table">
                        <tbody>

                            <tr>
                                <td class="sign"></td>
                                ${createRow(originalTop)}
                            </tr>
                `;

                // Show adjusted digits after borrowing
                if (
                    operation === "subtract" &&
                    columns.some(column =>
                        column.borrowEvents.length > 0
                    )
                ) {

                    table += `
                        <tr class="carry-row">
                            <td class="sign">→</td>
                            ${createRow(topDigits)}
                        </tr>
                    `;
                }

                // Show the bottom number
                table += `
                    <tr>
                        <td class="sign">
                            ${operation === "add" ? "+" : "-"}
                        </td>

                        ${createRow(bottomDigits)}
                    </tr>

                    <tr class="answer-row">
                        <td class="sign"></td>
                        ${createRow(resultDigits)}
                    </tr>

                        </tbody>
                    </table>
                `;

                return table;
            }

            // ==================================================
            // BUILD STEP-BY-STEP EXPLANATIONS
            // ==================================================

            let stepsHTML =
                "<h3>Step-by-Step Instructions</h3>";

            let runningTotal = values[0];

            stepsHTML += `
                <div class="addition-step">

                    <h4>Step 1: Starting Number</h4>

                    <p>
                        Start with
                        <strong>${numbers[0]}</strong>.
                    </p>

                </div>
            `;

            // Process each additional number
            for (let i = 1; i < values.length; i++) {

                const nextNumber = values[i];

                const previousTotal = runningTotal;

                const absolutePrevious =
                    previousTotal < 0n
                    ? -previousTotal
                    : previousTotal;

                const absoluteNext =
                    nextNumber < 0n
                    ? -nextNumber
                    : nextNumber;

                let operation;

                let larger;
                let smaller;

                let resultSign;

                // Determine whether to add or subtract
                if (
                    previousTotal === 0n ||
                    nextNumber === 0n
                ) {

                    operation = "add";

                    larger = absolutePrevious;
                    smaller = absoluteNext;

                    resultSign = previousTotal === 0n
                        ? (nextNumber < 0n ? -1n : 1n)
                        : (previousTotal < 0n ? -1n : 1n);

                }

                // Same signs: add absolute values
                else if (
                    (previousTotal < 0n) === (nextNumber < 0n)
                ) {

                    operation = "add";

                    larger = absolutePrevious;
                    smaller = absoluteNext;

                    resultSign = previousTotal < 0n ? -1n : 1n;

                }

                // Different signs: subtract absolute values
                else {

                    operation = "subtract";

                    larger = absolutePrevious >= absoluteNext
                        ? absolutePrevious
                        : absoluteNext;

                    smaller = absolutePrevious >= absoluteNext
                        ? absoluteNext
                        : absolutePrevious;

                    if (absolutePrevious === absoluteNext) {

                        resultSign = 0n;

                    } else if (absolutePrevious > absoluteNext) {

                        resultSign =
                            previousTotal < 0n ? -1n : 1n;

                    } else {

                        resultSign =
                            nextNumber < 0n ? -1n : 1n;
                    }
                }

                // Calculate each column
                const calculation = calculateColumns(
                    larger,
                    smaller,
                    operation
                );

                // Apply the correct sign
                runningTotal = calculation.result === 0n
                    ? 0n
                    : calculation.result * resultSign;

                // Explain the operation
                let explanation;

                if (operation === "add") {

                    explanation = `
                        Both numbers have the same sign,
                        or one number is zero.

                        Add the absolute values and
                        keep the sign of the nonzero number.
                    `;

                } else {

                    explanation = `
                        The numbers have different signs.

                        Ignore the signs temporarily.
                        Subtract the smaller absolute value
                        from the larger absolute value.
                    `;
                }

                // Explain every column
                let columnSteps = "";

                calculation.columns.forEach(column => {

                    const placeName = getPlaceName(
                        column.position
                    );

                    if (operation === "subtract") {

                        let borrowingExplanation = "";

                        column.borrowEvents.forEach(event => {

                            const eventPlace = getPlaceName(
                                event.position
                            );

                            if (event.type === "donor") {

                                borrowingExplanation += `
                                    <p>
                                        Borrow 1 from the
                                        ${eventPlace} column.

                                        Change ${event.before}
                                        to ${event.after}.
                                    </p>
                                `;
                            }

                            else if (event.type === "middle") {

                                borrowingExplanation += `
                                    <p>
                                        The ${eventPlace} column
                                        was zero.

                                        Change 0 to 9 as the
                                        borrowing passes through.
                                    </p>
                                `;
                            }

                            else if (event.type === "current") {

                                borrowingExplanation += `
                                    <p>
                                        Add 10 to the
                                        ${placeName} column.

                                        Change ${event.before}
                                        to ${event.after}.
                                    </p>
                                `;
                            }
                        });

                        columnSteps += `
                            <div class="addition-step">

                                <h4>${placeName} Column</h4>

                                ${borrowingExplanation}

                                <p>
                                    Now subtract:

                                    ${column.topAfter}
                                    - ${column.bottomDigit}
                                    = ${column.resultDigit}
                                </p>

                                <p>
                                    Write down
                                    <strong>${column.resultDigit}</strong>.
                                </p>

                            </div>
                        `;
                    }

                    else {

                        columnSteps += `
                            <div class="addition-step">

                                <h4>${placeName} Column</h4>

                                <p>
                                    ${column.topBefore}
                                    + ${column.bottomDigit}
                                    ${column.carryIn > 0
                                        ? `+ ${column.carryIn}`
                                        : ""}
                                    = ${column.columnTotal}
                                </p>

                                <p>
                                    Write down
                                    <strong>${column.resultDigit}</strong>.

                                    ${
                                        column.carryOut > 0
                                        ? `Carry ${column.carryOut}
                                           into the next column.`
                                        : "No carry is needed."
                                    }
                                </p>

                            </div>
                        `;
                    }
                });

                // Explain the final sign
                let signExplanation;

                if (runningTotal === 0n) {

                    signExplanation = `
                        The absolute values are equal.
                        The numbers cancel each other out.
                        The answer is zero.
                    `;

                } else if (operation === "add") {

                    signExplanation = `
                        Keep the sign of the original numbers.
                    `;

                } else {

                    signExplanation = `
                        Keep the sign of the number
                        with the greater absolute value.

                        The answer is
                        ${resultSign < 0n ? "negative" : "positive"}.
                    `;
                }

                // Add the complete step to the page
                stepsHTML += `

                    <div class="addition-step">

                        <h4>Step ${i + 1}: Add ${numbers[i]}</h4>

                        <p>
                            ${formatNumber(previousTotal)}
                            + (${numbers[i]})
                        </p>

                        <p>${explanation}</p>

                        <div class="vertical-problem">

                            ${createColumnTable(
                                calculation,
                                operation
                            )}

                        </div>

                        ${columnSteps}

                        <p>
                            <strong>Determine the sign:</strong>
                            ${signExplanation}
                        </p>

                        <p>
                            Running total:
                            <strong>
                                ${formatNumber(runningTotal)}
                            </strong>
                        </p>

                    </div>
                `;
            }

            // Display the complete solution
            answerDisplay.innerHTML = `

                <div class="step-explanations">
                    ${stepsHTML}
                </div>

                <div class="final-answer">

                    <h3>Final Answer</h3>

                    <h2>${formatNumber(runningTotal)}</h2>

                </div>

            `;

            // Stop here; do not run positive calculation
            return;
        }

        // ==================================================
        // POSITIVE NUMBER CALCULATION
        // ==================================================

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

            const whole = parts[0].padStart(
                wholePlaces, "0"
            );

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

            answerWhole = answerDigits.slice(
                0, -decimalPlaces
            );

            answerDecimal = answerDigits.slice(
                -decimalPlaces
            );

            answerWhole = answerWhole.replace(
                /^0+(?=\d)/, ""
            );

            answerDecimal = answerDecimal.replace(
                /0+$/, ""
            );

        } else {

            answerWhole = answerDigits.replace(
                /^0+(?=\d)/, ""
            );

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

            const padded = digitString.padStart(
                displayWidth, "0"
            );

            let cells = "";

            for (let i = 0; i < displayWidth; i++) {

                if (
                    decimalPlaces > 0 &&
                    i === displayWidth - decimalPlaces
                ) {
                    cells += `
                        <td class="decimal-point">.</td>
                    `;
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
                carryRow += `
                    <td class="decimal-point">.</td>
                `;
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
        let stepsHTML =
            "<h3>Step-by-Step Instructions</h3>";

        let stepNumber = 1;

        // Process columns from right to left
        for (let i = 0; i < columns.length; i++) {

            const column = columns[i];

            let placeName;

            if (i < decimalPlaces) {

                const decimalPosition =
                    decimalPlaces - 1 - i;

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

        // Display the complete positive-number solution
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
