/*
 * TillCheck - Cash Count
 * Phase 6.4
 *
 * Includes:
 * - Cash denomination calculation
 * - Actual Cash
 * - Expected Cash
 * - Cash In / Cash Out
 * - Remaining Cash
 * - Remit
 * - Difference
 * - Cash movement management
 * - Shift-aware saving
 * - Previous Shift -> Starting Cash
 * - Previous Shift Transfer -> Starting Cash
 * - Shift Transfer visibility
 * - Transfer validation
 */

/*
 * =========================================================
 * ELEMENTS
 * =========================================================
 */

const countType = document.getElementById("count-type");

const startingCashSource = document.getElementById("starting-cash-source");

const startingCashInput = document.getElementById("starting-cash-input");

const startingCashNote = document.getElementById("starting-cash-note");

const salesCashInput = document.getElementById("sales-cash-input");

const startingCashDisplay = document.getElementById("starting-cash-display");

const salesCashDisplay = document.getElementById("sales-cash-display");

const cashInDisplay = document.getElementById("cash-in-display");

const cashOutDisplay = document.getElementById("cash-out-display");

const expectedCashDisplay = document.getElementById("expected-cash-display");

const remainingCashInput = document.getElementById("remaining-cash-input");

const actualCashDisplay = document.getElementById("actual-cash");

const remitDisplay = document.getElementById("remit-amount");

const remitValidation = document.getElementById("remit-validation");

const transferRemaining = document.getElementById("transfer-remaining");

const transferRemit = document.getElementById("transfer-remit");

const differenceDisplay = document.getElementById("difference");

const differenceStatus = document.getElementById("difference-status");

const movementType = document.getElementById("movement-type");

const movementAmount = document.getElementById("movement-amount");

const movementReason = document.getElementById("movement-reason");

const addMovementButton = document.getElementById("add-movement-button");

const movementList = document.getElementById("movement-list");

const saveButton = document.getElementById("save-cash-count-button");

/*
 * =========================================================
 * CURRENT SHIFT
 * =========================================================
 */

const currentShiftId =
  typeof window.currentShiftId !== "undefined" ? window.currentShiftId : null;

/*
 * =========================================================
 * DATA
 * =========================================================
 */

let cashMovements = [];

/*
 * =========================================================
 * FORMAT CURRENCY
 * =========================================================
 */

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

/*
 * =========================================================
 * NUMBER HELPER
 * =========================================================
 */

function getNumberValue(element) {
  if (!element) {
    return 0;
  }

  const value = parseFloat(element.value);

  return Number.isFinite(value) ? value : 0;
}

/*
 * =========================================================
 * LOAD PREVIOUS SHIFT CASH
 * =========================================================
 */

async function loadPreviousShiftCash() {
  if (!startingCashInput) {
    return;
  }

  if (!startingCashNote) {
    return;
  }

  startingCashNote.textContent = "Loading previous shift cash...";

  try {
    const response = await fetch("/previous-shift-cash");

    const result = await response.json();

    if (!result.success) {
      startingCashNote.textContent = result.message;

      return;
    }

    startingCashInput.value = result.remaining_cash;

    startingCashNote.textContent =
      "Starting cash loaded from the previous shift.";

    startingCashInput.dispatchEvent(new Event("input"));
  } catch (error) {
    console.error(error);

    startingCashNote.textContent = "Could not load previous shift cash.";
  }
}

/*
 * =========================================================
 * LOAD PREVIOUS SHIFT TRANSFER CASH
 * =========================================================
 */

async function loadPreviousTransferCash() {
  if (!startingCashInput) {
    return;
  }

  if (!startingCashNote) {
    return;
  }

  startingCashNote.textContent = "Loading previous shift transfer...";

  try {
    const response = await fetch("/previous-transfer-cash");

    const result = await response.json();

    if (!result.success) {
      startingCashNote.textContent = result.message;

      return;
    }

    startingCashInput.value = result.remaining_cash;

    startingCashNote.textContent =
      "Starting cash loaded from the previous shift transfer.";

    startingCashInput.dispatchEvent(new Event("input"));
  } catch (error) {
    console.error(error);

    startingCashNote.textContent = "Could not load previous shift transfer.";
  }
}

/*
 * =========================================================
 * CALCULATE ACTUAL CASH
 * =========================================================
 */

function calculateActualCash() {
  let actualCash = 0;

  const denominationRows = document.querySelectorAll(".denomination-row");

  denominationRows.forEach((row) => {
    const denomination = parseFloat(row.dataset.denomination);

    const quantityInput = row.querySelector("input");

    if (!quantityInput) {
      return;
    }

    const quantity = parseInt(quantityInput.value, 10);

    if (
      Number.isFinite(denomination) &&
      Number.isFinite(quantity) &&
      quantity > 0
    ) {
      actualCash += denomination * quantity;
    }
  });

  if (actualCashDisplay) {
    actualCashDisplay.textContent = formatCurrency(actualCash);
  }

  return actualCash;
}

/*
 * =========================================================
 * CALCULATE CASH MOVEMENTS
 * =========================================================
 */

function calculateCashMovements() {
  let cashIn = 0;
  let cashOut = 0;

  cashMovements.forEach((movement) => {
    if (movement.type === "in") {
      cashIn += movement.amount;
    }

    if (movement.type === "out") {
      cashOut += movement.amount;
    }
  });

  if (cashInDisplay) {
    cashInDisplay.textContent = formatCurrency(cashIn);
  }

  if (cashOutDisplay) {
    cashOutDisplay.textContent = formatCurrency(cashOut);
  }

  return {
    cashIn,
    cashOut,
  };
}

/*
 * =========================================================
 * CALCULATE EXPECTED CASH
 *
 * Expected Cash =
 * Starting Cash
 * + Cash Sales
 * + Cash In
 * - Cash Out
 * =========================================================
 */

function calculateExpectedCash() {
  const startingCash = getNumberValue(startingCashInput);

  const salesCash = getNumberValue(salesCashInput);

  const movements = calculateCashMovements();

  const expectedCash =
    startingCash + salesCash + movements.cashIn - movements.cashOut;

  if (startingCashDisplay) {
    startingCashDisplay.textContent = formatCurrency(startingCash);
  }

  if (salesCashDisplay) {
    salesCashDisplay.textContent = formatCurrency(salesCash);
  }

  if (expectedCashDisplay) {
    expectedCashDisplay.textContent = formatCurrency(expectedCash);
  }

  return expectedCash;
}

/*
 * =========================================================
 * CALCULATE REMIT
 * =========================================================
 */

function calculateRemit(actualCash) {
  const remainingCash = getNumberValue(remainingCashInput);

  const remit = actualCash - remainingCash;

  if (remitDisplay) {
    remitDisplay.textContent = formatCurrency(remit);
  }

  if (transferRemaining) {
    transferRemaining.textContent = formatCurrency(remainingCash);
  }

  if (transferRemit) {
    transferRemit.textContent = formatCurrency(remit);
  }

  /*
   * Remit + Remaining = Actual Cash
   */

  const validationTotal = remit + remainingCash;

  const validationDifference = Math.abs(validationTotal - actualCash);

  if (remitValidation) {
    if (validationDifference < 0.005) {
      remitValidation.textContent = "✓ Remit + Remaining = Actual Cash";
    } else {
      remitValidation.textContent =
        "⚠ Remit + Remaining does not equal Actual Cash";
    }
  }

  return remit;
}

/*
 * =========================================================
 * CALCULATE DIFFERENCE
 *
 * Difference =
 * Actual Cash - Expected Cash
 * =========================================================
 */

function calculateDifference(actualCash, expectedCash) {
  const difference = actualCash - expectedCash;

  if (differenceDisplay) {
    differenceDisplay.textContent = formatCurrency(difference);
  }

  if (differenceStatus) {
    if (Math.abs(difference) < 0.005) {
      differenceStatus.textContent = "No Difference";
    } else if (difference < 0) {
      differenceStatus.textContent = "Shortage";
    } else {
      differenceStatus.textContent = "Overage";
    }
  }

  return difference;
}

/*
 * =========================================================
 * UPDATE ALL CALCULATIONS
 * =========================================================
 */

function updateCalculations() {
  const actualCash = calculateActualCash();

  const expectedCash = calculateExpectedCash();

  calculateRemit(actualCash);

  calculateDifference(actualCash, expectedCash);
}

/*
 * =========================================================
 * TRANSFER VISIBILITY
 * =========================================================
 */

function updateTransferVisibility() {
  const transferSummary = document.querySelector(".transfer-summary");

  if (!transferSummary) {
    return;
  }

  if (countType && countType.value === "transfer") {
    transferSummary.style.display = "block";
  } else {
    transferSummary.style.display = "none";
  }
}

/*
 * =========================================================
 * UPDATE COUNT TYPE BEHAVIOR
 * =========================================================
 */

function updateCountTypeBehavior() {
  if (!countType) {
    return;
  }

  const selectedType = countType.value;

  /*
   * Opening Count
   */

  if (selectedType === "opening") {
    if (countTypeNote) {
      countTypeNote.textContent =
        "Opening Count: record the cash available when the shift begins.";
    }

    if (startingCashNote) {
      startingCashNote.textContent =
        "Enter or load the starting cash for this shift.";
    }

    return;
  }

  /*
   * Shift Transfer
   */

  if (selectedType === "transfer") {
    if (countTypeNote) {
      countTypeNote.textContent =
        "Shift Transfer: record the cash being handed over to the next shift.";
    }

    if (startingCashNote) {
      startingCashNote.textContent =
        "Record the cash position before handing over the register.";
    }

    return;
  }

  /*
   * Closing Count
   */

  if (selectedType === "closing") {
    if (countTypeNote) {
      countTypeNote.textContent =
        "Closing Count: record the final cash position at the end of the shift.";
    }

    if (startingCashNote) {
      startingCashNote.textContent =
        "Record the final cash position before closing the shift.";
    }

    return;
  }

  /*
   * Manual Count
   */

  if (selectedType === "manual") {
    if (countTypeNote) {
      countTypeNote.textContent =
        "Manual Count: use this for a general cash count that is not tied to opening, transfer, or closing.";
    }

    if (startingCashNote) {
      startingCashNote.textContent = "Manual cash count.";
    }
  }
}

/*
 * =========================================================
 * RENDER CASH MOVEMENTS
 * =========================================================
 */

function renderCashMovements() {
  if (!movementList) {
    return;
  }

  movementList.innerHTML = "";

  if (cashMovements.length === 0) {
    movementList.innerHTML = "<p>No cash movements added.</p>";

    return;
  }

  cashMovements.forEach((movement, index) => {
    const movementItem = document.createElement("div");

    movementItem.className = "movement-item";

    const typeLabel = movement.type === "in" ? "Cash In" : "Cash Out";

    movementItem.innerHTML = `
                <div class="movement-details">

                    <strong>
                        ${typeLabel}
                    </strong>

                    <span>
                        ${formatCurrency(movement.amount)}
                    </span>

                    <small>
                        ${movement.reason}
                    </small>

                </div>

                <button
                    type="button"
                    class="remove-movement-button"
                    data-index="${index}"
                >
                    Remove
                </button>
            `;

    movementList.appendChild(movementItem);
  });

  const removeButtons = document.querySelectorAll(".remove-movement-button");

  removeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const index = parseInt(button.dataset.index, 10);

      cashMovements.splice(index, 1);

      renderCashMovements();

      updateCalculations();
    });
  });
}

/*
 * =========================================================
 * ADD CASH MOVEMENT
 * =========================================================
 */

if (addMovementButton) {
  addMovementButton.addEventListener("click", () => {
    const type = movementType.value;

    const amount = parseFloat(movementAmount.value);

    const reason = movementReason.value.trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Please enter a valid amount.");

      return;
    }

    if (!reason) {
      alert("Please enter a reason.");

      return;
    }

    cashMovements.push({
      type: type,
      amount: amount,
      reason: reason,
    });

    movementAmount.value = "";

    movementReason.value = "";

    renderCashMovements();

    updateCalculations();
  });
}

/*
 * =========================================================
 * DENOMINATION INPUTS
 * =========================================================
 */

const denominationInputs = document.querySelectorAll(".denomination-row input");

denominationInputs.forEach((input) => {
  input.addEventListener("input", updateCalculations);
});

/*
 * =========================================================
 * STARTING CASH INPUT
 * =========================================================
 */

if (startingCashInput) {
  startingCashInput.addEventListener("input", updateCalculations);
}

/*
 * =========================================================
 * CASH SALES INPUT
 * =========================================================
 */

if (salesCashInput) {
  salesCashInput.addEventListener("input", updateCalculations);
}

/*
 * =========================================================
 * REMAINING CASH INPUT
 * =========================================================
 */

if (remainingCashInput) {
  remainingCashInput.addEventListener("input", updateCalculations);
}

/*
 * =========================================================
 * STARTING CASH SOURCE
 * =========================================================
 */

if (startingCashSource) {
  startingCashSource.addEventListener("change", async () => {
    /*
     * Previous Shift
     */

    if (startingCashSource.value === "previous-shift") {
      await loadPreviousShiftCash();

      return;
    }

    /*
     * Previous Shift Transfer
     */

    if (startingCashSource.value === "previous-transfer") {
      await loadPreviousTransferCash();

      return;
    }

    /*
     * Manual Entry
     */

    if (startingCashNote) {
      startingCashNote.textContent = "Enter the starting cash manually.";
    }

    startingCashInput.value = "";

    startingCashInput.dispatchEvent(new Event("input"));
  });
}

/*
 * =========================================================
 * COUNT TYPE
 * =========================================================
 */

if (countType) {
  countType.addEventListener("change", () => {
    updateTransferVisibility();

    updateCountTypeBehavior();

    updateCalculations();
  });
}

/*
 * =========================================================
 * GET DENOMINATION DATA
 * =========================================================
 */

function getDenominationData() {
  const denominations = [];

  const rows = document.querySelectorAll(".denomination-row");

  rows.forEach((row) => {
    const denomination = parseFloat(row.dataset.denomination);

    const input = row.querySelector("input");

    if (!input) {
      return;
    }

    const quantity = parseInt(input.value, 10);

    if (Number.isFinite(denomination) && Number.isFinite(quantity)) {
      denominations.push({
        denomination: denomination,

        quantity: quantity,

        subtotal: denomination * quantity,
      });
    }
  });

  return denominations;
}

/*
 * =========================================================
 * SAVE CASH COUNT
 * =========================================================
 */

if (saveButton) {
  saveButton.addEventListener("click", async () => {
    const actualCash = calculateActualCash();

    const expectedCash = calculateExpectedCash();

    const remainingCash = getNumberValue(remainingCashInput);

    const remit = actualCash - remainingCash;

    const difference = actualCash - expectedCash;

    const startingCash = getNumberValue(startingCashInput);

    const salesCash = getNumberValue(salesCashInput);

    const movements = calculateCashMovements();

    /*
     * =================================================
     * SHIFT VALIDATION
     * =================================================
     */

    if (!currentShiftId) {
      alert("No open shift. Please open a shift first.");

      return;
    }

    /*
     * =================================================
     * GENERAL CASH VALIDATION
     * =================================================
     */

    if (actualCash < 0) {
      alert("Actual cash cannot be negative.");

      return;
    }

    /*
     * =================================================
     * TRANSFER VALIDATION
     * =================================================
     */

    if (countType && countType.value === "transfer") {
      if (actualCash <= 0) {
        alert("A Shift Transfer must have actual cash.");

        return;
      }

      if (remainingCash < 0) {
        alert("Remaining Cash cannot be negative.");

        return;
      }

      if (remainingCash > actualCash) {
        alert("Remaining Cash cannot be greater than Actual Cash.");

        return;
      }

      if (remit < 0) {
        alert("Remit cannot be negative.");

        return;
      }
    }

    saveButton.disabled = true;

    try {
      const response = await fetch("/save-cash-count", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          shift_id: currentShiftId,

          count_type: countType ? countType.value : "manual",

          starting_cash: startingCash,

          cash_sales: salesCash,

          cash_in: movements.cashIn,

          cash_out: movements.cashOut,

          expected_cash: expectedCash,

          actual_cash: actualCash,

          remaining_cash: remainingCash,

          remit: remit,

          difference: difference,

          denominations: getDenominationData(),

          cash_movements: cashMovements,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("Cash count saved successfully.");

        window.location.href = `/cash-count/${result.cash_count_id}`;
      } else {
        alert(result.message || "Could not save cash count.");

        saveButton.disabled = false;
      }
    } catch (error) {
      console.error(error);

      alert("An error occurred while saving the cash count.");

      saveButton.disabled = false;
    }
  });
}

/*
 * =========================================================
 * INITIALIZE
 * =========================================================
 */

renderCashMovements();

updateTransferVisibility();

updateCountTypeBehavior();

updateCalculations();
