(function () {

    console.log("Math Scientia Subtraction is running!");

    // ==================================================
    // WORKSPACE ELEMENTS
    // ==================================================

    const subtractionButton = document.getElementById("subtraction");
    const workspace = document.getElementById("math-workspace");
    const workspaceTitle = document.getElementById("workspace-title");
    const workspaceContent = document.getElementById("workspace-content");

    if (!subtractionButton || !workspace || !workspaceTitle || !workspaceContent) {
        console.error("Subtraction could not find the workspace elements.");
        return;
    }

    // Open the Subtraction workspace
    subtractionButton.addEventListener("click", function () {

        workspace.classList.remove("hidden");
        workspaceTitle.textContent = "Subtraction";

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

        document.getElementById("solve-button")
            .addEventListener("click", solveSubtraction);

    });


    // ==================================================
    // NUMBER FORMATTING
    // ==================================================

    function getDecimalPlaces(number) {
        return (number.split(".")[1] || "").length;
    }


    function toScaledInteger(number, decimalPlaces) {

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


    function formatNumber(value, decimalPlaces) {

        const negative = value < 0n;
        const absolute = negative ? -value : value;

        let digits = absolute.toString();

        if (decimalPlaces > 0) {

            digits = digits.padStart(
                decimalPlaces + 1, "0"
            );

            const whole = digits.slice(0, -decimalPlaces);

            let decimal = digits.slice(-decimalPlaces);

            decimal = decimal.replace(/0+$/, "");

            digits = decimal
                ? whole + "." + decimal
                : whole;
        }

        return (negative && absolute !== 0n ? "-" : "") + digits;
    }


    function getPlaceName(position, decimalPlaces) {

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
    // COLUMN SUBTRACTION AND BORROWING
    // ==================================================

    function createColumnSubtraction(topValue, bottomValue, decimalPlaces) {

        const width = Math.max(
            topValue.toString().length,
            bottomValue.toString().length,
            decimalPlaces + 1
        );

        const topDigits = topValue.toString()
            .padStart(width, "0")
            .split("")
            .map(Number);

        const bottomDigits = bottomValue.toString()
            .padStart(width, "0")
            .split("")
            .map(Number);

        const workingDigits = [...topDigits];

        const resultDigits = Array(width).fill(0);

        let columnSteps = "";
        let borrowExplanation = "";

        // Work from right to left
        for (let i = width - 1; i >= 0; i--) {

            const position = width - 1 - i;

            const placeName = getPlaceName(
                position,
                decimalPlaces
            );

            const bottomDigit = bottomDigits[i];

            let topDigit = workingDigits[i];

            // Check whether borrowing is needed
            if (topDigit < bottomDigit) {

                let donor = i - 1;

                // Find a column that can lend
                while (
                    donor >= 0 &&
                    workingDigits[donor] === 0
                ) {
                    donor--;
                }

                if (donor < 0) {
                    throw new Error("Unable to complete borrowing.");
                }

                const donorBefore = workingDigits[donor];

                const donorPlace = getPlaceName(
                    width - 1 - donor,
                    decimalPlaces
                );

                // Reduce the donating column
                workingDigits[donor]--;

                // Change zeros between columns into nines
                for (let j = donor + 1; j < i; j++) {

                    if (workingDigits[j] === 0) {

                        workingDigits[j] = 9;

                        const middlePlace = getPlaceName(
                            width - 1 - j,
                            decimalPlaces
                        );

                        borrowExplanation += `
                            <p>
                                The ${middlePlace} column
                                was zero. When borrowing passes
                                through it, the zero becomes 9.
                            </p>
                        `;
                    }
                }

                // Give ten to the current column
                workingDigits[i] += 10;

                topDigit = workingDigits[i];

                borrowExplanation += `
                    <p>
                        We cannot subtract ${bottomDigit}
                        from ${topDigits[i]} in the ${placeName} column.
                    </p>

                    <p>
                        Borrow 1 from the ${donorPlace} column.
                        Its value changes from
                        <strong>${donorBefore}</strong>
                        to <strong>${workingDigits[donor]}</strong>.
                    </p>

                    <p>
                        The ${placeName} column receives 10.
                        Its value changes from
                        <strong>${topDigits[i]}</strong>
                        to <strong>${topDigit}</strong>.
                    </p>
                `;
            }

            // Subtract the digits
            const resultDigit = topDigit - bottomDigit;

            resultDigits[i] = resultDigit;

            columnSteps += `
                <div class="addition-step">

                    <h4>${placeName} Column</h4>

                    <p>
                        ${topDigit} − ${bottomDigit}
                        = ${resultDigit}
                    </p>

                    <p>
                        Write down <strong>${resultDigit}</strong>.
                    </p>

                </div>
            `;
        }


        // Build rows for the table
        function createRow(digits) {

            let row = "";

            digits.forEach((digit, index) => {

                if (
                    decimalPlaces > 0 &&
                    index === width - decimalPlaces
                ) {
                    row += `<td class="decimal-point">.</td>`;
                }

                row += `<td>${digit}</td>`;
            });

            return row;
        }


        const borrowingOccurred = workingDigits.some(
            (digit, index) => digit !== topDigits[index]
        );

        const table = `
            <h3>Let's Work It Out!</h3>

            <table class="addition-table">

                <tbody>

                    <tr>
                        <td class="sign"></td>
                        ${createRow(topDigits)}
                    </tr>

                    ${borrowingOccurred ? `
                        <tr class="carry-row">
                            <td class="sign">↳</td>
                            ${createRow(workingDigits)}
                        </tr>
                    ` : ""}

                    <tr>
                        <td class="sign">−</td>
                        ${createRow(bottomDigits)}
                    </tr>

                    <tr class="answer-row">
                        <td class="sign"></td>
                        ${createRow(resultDigits)}
                    </tr>

                </tbody>

            </table>
        `;

        return {
            table,
            borrowExplanation,
            columnSteps
        };
    }


    // ==================================================
    // COLUMN ADDITION AND CARRYING
    // ==================================================

    function createColumnAddition(topValue, bottomValue, decimalPlaces) {

        const width = Math.max(
            topValue.toString().length,
            bottomValue.toString().length,
            decimalPlaces + 1
        );

        const topDigits = topValue.toString()
            .padStart(width, "0")
            .split("")
            .map(Number);

        const bottomDigits = bottomValue.toString()
            .padStart(width, "0")
            .split("")
            .map(Number);

        const resultDigits = Array(width).fill(0);
        const carryDigits = Array(width).fill("");

        let carry = 0;
        let columnSteps = "";

        // Work from right to left
        for (let i = width - 1; i >= 0; i--) {

            const position = width - 1 - i;

            const placeName = getPlaceName(
                position,
                decimalPlaces
            );

            const topDigit = topDigits[i];
            const bottomDigit = bottomDigits[i];

            const incomingCarry = carry;

            const total = topDigit + bottomDigit + incomingCarry;

            const resultDigit = total % 10;

            const nextCarry = Math.floor(total / 10);

            resultDigits[i] = resultDigit;

            // Place the carry above the next column
            if (nextCarry > 0 && i > 0) {
                carryDigits[i - 1] = nextCarry;
            }

            columnSteps += `
                <div class="addition-step">

                    <h4>${placeName} Column</h4>

                    <p>
                        ${topDigit} + ${bottomDigit}
                        ${incomingCarry > 0 ? `+ ${incomingCarry}` : ""}
                        = ${total}
                    </p>

                    ${nextCarry > 0 ? `
                        <p>
                            Write down ${resultDigit}
                            and carry ${nextCarry}
                            to the next column.
                        </p>
                    ` : `
                        <p>
                            Write down
                            <strong>${resultDigit}</strong>.
                        </p>
                    `}

                </div>
            `;

            carry = nextCarry;
        }

        // Check for an extra carry at the beginning
        const extraDigit = carry > 0;

        if (extraDigit) {
            resultDigits.unshift(carry);
            carryDigits.unshift("");
        }


        // Create a table row
        function createRow(digits, addDecimal = true) {

            let row = "";

            digits.forEach((digit, index) => {

                if (
                    addDecimal &&
                    decimalPlaces > 0 &&
                    index === digits.length - decimalPlaces
                ) {
                    row += `<td class="decimal-point">.</td>`;
                }

                row += `<td>${digit}</td>`;
            });

            return row;
        }


        // Align the original numbers with an extra answer digit
        const displayTop = extraDigit
            ? ["", ...topDigits]
            : topDigits;

        const displayBottom = extraDigit
            ? ["", ...bottomDigits]
            : bottomDigits;

        const displayCarry = carryDigits;

        const borrowingOccurred = carryDigits.some(
            digit => digit !== ""
        );

        const table = `
            <h3>Let's Work It Out!</h3>

            <table class="addition-table">

                <tbody>

                    ${borrowingOccurred ? `
                        <tr class="carry-row">
                            <td class="sign"></td>
                            ${createRow(displayCarry)}
                        </tr>
                    ` : ""}

                    <tr>
                        <td class="sign"></td>
                        ${createRow(displayTop)}
                    </tr>

                    <tr>
                        <td class="sign">+</td>
                        ${createRow(displayBottom)}
                    </tr>

                    <tr class="answer-row">
                        <td class="sign"></td>
                        ${createRow(resultDigits)}
                    </tr>

                </tbody>

            </table>
        `;

        return {
            table,
            columnSteps
        };
    }


    // ==================================================
    // SOLVE SUBTRACTION
    // ==================================================

    function solveSubtraction() {

        const answerDisplay =
            document.getElementById("answer-display");

        // Collect all four numbers
        const numbers = [
            document.getElementById("number-one").value.trim(),
            document.getElementById("number-two").value.trim(),
            document.getElementById("number-three").value.trim(),
            document.getElementById("number-four").value.trim()
        ].filter(number => number !== "");

        answerDisplay.innerHTML = "";

        // Require at least two numbers
        if (numbers.length < 2) {

            answerDisplay.textContent =
                "Please enter at least two numbers.";

            return;
        }

        // Validate input
        const numberPattern = /^-?\d+(\.\d+)?$/;

        if (!numbers.every(number => numberPattern.test(number))) {

            answerDisplay.textContent =
                "Please enter valid positive or negative numbers.";

            return;
        }

        // Determine decimal precision
        const decimalPlaces = Math.max(
            ...numbers.map(getDecimalPlaces)
        );

        // Convert numbers to scaled integers
        const values = numbers.map(number =>
            toScaledInteger(number, decimalPlaces)
        );

        // Starting number
        let runningTotal = values[0];

        let stepsHTML = `
            <h3>Step-by-Step Instructions</h3>

            <div class="addition-step">

                <h4>Starting Number</h4>

                <p>
                    Start with
                    <strong>${numbers[0]}</strong>.
                </p>

            </div>
        `;


        // Process each subtraction
        for (let i = 1; i < values.length; i++) {

            const nextNumber = values[i];

            const previousTotal = runningTotal;

            const absolutePrevious = previousTotal < 0n
                ? -previousTotal
                : previousTotal;

            const absoluteNext = nextNumber < 0n
                ? -nextNumber
                : nextNumber;

            let operation;
            let larger;
            let smaller;
            let resultSign;

            // Different signs mean adding absolute values
            if (
                (previousTotal < 0n) !== (nextNumber < 0n)
            ) {

                operation = "add";

                larger = absolutePrevious;
                smaller = absoluteNext;

                resultSign = previousTotal < 0n ? -1n : 1n;

            } else {

                // Same signs mean subtracting absolute values
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

                    resultSign = previousTotal < 0n ? -1n : 1n;

                } else {

                    resultSign = previousTotal < 0n ? 1n : -1n;

                }
            }

            // Calculate the result
            const magnitude = operation === "add"
                ? larger + smaller
                : larger - smaller;

            runningTotal = magnitude === 0n
                ? 0n
                : magnitude * resultSign;

            const previousFormatted = formatNumber(
                previousTotal,
                decimalPlaces
            );

            const nextFormatted = formatNumber(
                nextNumber,
                decimalPlaces
            );

            const resultFormatted = formatNumber(
                runningTotal,
                decimalPlaces
            );


            // ==================================================
            // EXPLANATION
            // ==================================================

            let explanation = "";
            let columnHTML = "";

            if (operation === "add") {

                if (previousTotal < 0n && nextNumber > 0n) {

                    explanation = `
                        <p>
                            We are subtracting a positive number
                            from a negative number.
                        </p>

                        <p>
                            When we subtract a positive number,
                            we move farther in the negative direction.
                        </p>

                        <p>
                            To find the distance from zero,
                            add the absolute values.
                        </p>
                    `;

                } else {

                    explanation = `
                        <p>
                            Subtracting a negative number is the
                            same as adding a positive number.
                        </p>

                        <p>
                            Add the absolute values.
                        </p>
                    `;
                }

                // Show vertical addition with carrying
                const calculation = createColumnAddition(
                    absolutePrevious,
                    absoluteNext,
                    decimalPlaces
                );

                columnHTML = `
                    <div class="vertical-problem">

                        ${calculation.table}

                    </div>

                    <div class="step-explanations">

                        ${calculation.columnSteps}

                    </div>
                `;

            } else {

                explanation = `
                    <p>
                        The numbers have the same sign.
                        Ignore the signs temporarily and subtract
                        the smaller absolute value from the larger
                        absolute value.
                    </p>
                `;

                // Show vertical subtraction with borrowing
                const calculation = createColumnSubtraction(
                    larger,
                    smaller,
                    decimalPlaces
                );

                columnHTML = `
                    <div class="vertical-problem">

                        ${calculation.table}

                    </div>

                    <div class="step-explanations">

                        ${calculation.borrowExplanation}

                        ${calculation.columnSteps}

                    </div>
                `;
            }


            // ==================================================
            // DETERMINE THE SIGN
            // ==================================================

            let signExplanation = "";

            if (runningTotal === 0n) {

                signExplanation = `
                    The absolute values are equal.
                    They cancel each other out.
                    The answer is zero.
                `;

            } else if (operation === "add") {

                signExplanation = `
                    Keep the sign of the starting number.
                    The answer is
                    ${runningTotal < 0n ? "negative" : "positive"}.
                `;

            } else {

                signExplanation = `
                    Keep the sign of the number with the
                    greater absolute value.
                    The answer is
                    ${runningTotal < 0n ? "negative" : "positive"}.
                `;
            }


            // ==================================================
            // DISPLAY THE STEP
            // ==================================================

            stepsHTML += `

                <div class="addition-step">

                    <h4>Step ${i}: Subtract ${numbers[i]}</h4>

                    <p>
                        ${previousFormatted}
                        − (${nextFormatted})
                    </p>

                    ${explanation}

                    ${columnHTML}

                    <p>
                        <strong>Determine the sign:</strong>
                        ${signExplanation}
                    </p>

                    <p>
                        <strong>Result: ${resultFormatted}</strong>
                    </p>

                </div>

            `;
        }


        // ==================================================
        // FINAL ANSWER
        // ==================================================

        answerDisplay.innerHTML = `

            <div class="step-explanations">

                ${stepsHTML}

            </div>

            <div class="final-answer">

                <h3>Final Answer</h3>

                <h2>${formatNumber(runningTotal, decimalPlaces)}</h2>

            </div>

        `;
    }

})();
