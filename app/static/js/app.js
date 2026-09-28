document.addEventListener("DOMContentLoaded", () => {
  let cashMovements = [];

  // -----------------------------
  // Denominations
  // -----------------------------

  const denominationInputs = document.querySelectorAll(".denomination-input");

  // -----------------------------
  // Cash Inputs
  // -----------------------------

  const remainingCashInput = document.getElementById("remaining-cash-input");

  const startingCashInput = document.getElementById("starting-cash-input");

  const salesCashInput = document.getElementById("sales-cash-input");

  // -----------------------------
  // Cash Displays
  // -----------------------------

  const startingCashDisplay = document.getElementById("starting-cash-display");

  const salesCashDisplay = document.getElementById("sales-cash-display");

  const cashInDisplay = document.getElementById("cash-in-display");

  const cashOutDisplay = document.getElementById("cash-out-display");

  const expectedCashDisplay = document.getElementById("expected-cash-display");

  const remitDisplay = document.getElementById("remit-amount");

  const actualCashDisplay = document.getElementById("actual-cash");

  const differenceDisplay = document.getElementById("difference");

  const differenceStatus = document.getElementById("difference-status");

  const remitValidation = document.getElementById("remit-validation");

  // -----------------------------
  // Cash Movement Inputs
  // -----------------------------

  const movementTypeInput = document.getElementById("movement-type");

  const movementAmountInput = document.getElementById("movement-amount");

  const movementReasonInput = document.getElementById("movement-reason");

  const addMovementButton = document.getElementById("add-movement-button");

  const movementList = document.getElementById("movement-list");

  // -----------------------------
  // Currency Formatting
  // -----------------------------

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  }

  // -----------------------------
  // Calculate Actual Cash
  // -----------------------------

  function calculateActualCash() {
    let actualCash = 0;

    denominationInputs.forEach((input) => {
      const denomination = Number(input.dataset.value);

      const quantity = Number(input.value) || 0;

      actualCash += denomination * quantity;
    });

    return actualCash;
  }

  // -----------------------------
  // Calculate Difference
  // -----------------------------

  function calculateDifference(expectedCash) {
    const actualCash = calculateActualCash();

    const difference = actualCash - expectedCash;

    differenceDisplay.textContent = formatCurrency(difference);

    if (difference === 0) {
      differenceStatus.textContent = "No difference";
    } else if (difference < 0) {
      differenceStatus.textContent = "Shortage";
    } else {
      differenceStatus.textContent = "Overage";
    }
  }

  // -----------------------------
  // Calculate Expected Cash
  // -----------------------------

  function calculateExpectedCash() {
    const startingCash = Number(startingCashInput.value) || 0;

    const salesCash = Number(salesCashInput.value) || 0;

    let cashIn = 0;
    let cashOut = 0;

    cashMovements.forEach((movement) => {
      if (movement.type === "in") {
        cashIn += movement.amount;
      } else if (movement.type === "out") {
        cashOut += movement.amount;
      }
    });

    const expectedCash = startingCash + salesCash + cashIn - cashOut;

    startingCashDisplay.textContent = formatCurrency(startingCash);

    salesCashDisplay.textContent = formatCurrency(salesCash);

    cashInDisplay.textContent = formatCurrency(cashIn);

    cashOutDisplay.textContent = formatCurrency(cashOut);

    expectedCashDisplay.textContent = formatCurrency(expectedCash);

    calculateDifference(expectedCash);
  }

  // -----------------------------
  // Calculate Remit
  // -----------------------------

  function calculateRemit(actualCash) {
    const remainingCash = Number(remainingCashInput.value) || 0;

    const remit = actualCash - remainingCash;

    if (remit < 0) {
      remitDisplay.textContent = "Not enough cash";

      remitValidation.textContent =
        "Remaining cash is greater than actual cash.";

      return;
    }

    remitDisplay.textContent = formatCurrency(remit);

    const verifiedTotal = remit + remainingCash;

    if (verifiedTotal === actualCash) {
      remitValidation.textContent = "✓ Remit + Remaining = Actual Cash";
    } else {
      remitValidation.textContent = "⚠ Calculation error";
    }
  }

  // -----------------------------
  // Calculate Everything
  // -----------------------------

  function calculateCash() {
    let actualCash = 0;

    denominationInputs.forEach((input) => {
      const denomination = Number(input.dataset.value);

      const quantity = Number(input.value) || 0;

      const subtotal = denomination * quantity;

      actualCash += subtotal;

      const subtotalElement = document.getElementById(
        `subtotal-${denomination}`,
      );

      if (subtotalElement) {
        subtotalElement.textContent = formatCurrency(subtotal);
      }
    });

    actualCashDisplay.textContent = formatCurrency(actualCash);

    calculateExpectedCash();

    calculateRemit(actualCash);
  }

  // -----------------------------
  // Add Cash Movement
  // -----------------------------

  function addMovement() {
    const type = movementTypeInput.value;

    const amount = Number(movementAmountInput.value);

    const reason = movementReasonInput.value.trim();

    if (!amount || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (!reason) {
      alert("Please enter a reason.");
      return;
    }

    const movement = {
      type: type,
      amount: amount,
      reason: reason,
    };

    cashMovements.push(movement);

    renderMovements();

    movementAmountInput.value = "";
    movementReasonInput.value = "";

    calculateCash();
  }

  // -----------------------------
  // Display Cash Movements
  // -----------------------------

  function renderMovements() {
    movementList.innerHTML = "";

    if (cashMovements.length === 0) {
      movementList.innerHTML = "<p>No cash movements recorded.</p>";

      return;
    }

    cashMovements.forEach((movement, index) => {
      const movementElement = document.createElement("div");

      movementElement.className = "movement-item";

      const typeText = movement.type === "out" ? "Cash Out" : "Cash In";

      const sign = movement.type === "out" ? "-" : "+";

      movementElement.innerHTML = `
          <span class="movement-type">
            ${typeText}
          </span>

          <span class="movement-amount">
            ${sign}${formatCurrency(movement.amount)}
          </span>

          <span class="movement-reason">
            ${movement.reason}
          </span>

          <button
            type="button"
            class="remove-movement-button"
            data-index="${index}"
          >
            ×
          </button>
        `;

      movementList.appendChild(movementElement);
    });

    document.querySelectorAll(".remove-movement-button").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.index);

        cashMovements.splice(index, 1);

        renderMovements();

        calculateCash();
      });
    });
  }

  // -----------------------------
  // Event Listeners
  // -----------------------------

  startingCashInput.addEventListener("input", calculateCash);

  salesCashInput.addEventListener("input", calculateCash);

  remainingCashInput.addEventListener("input", calculateCash);

  denominationInputs.forEach((input) => {
    input.addEventListener("input", calculateCash);
  });

  addMovementButton.addEventListener("click", addMovement);

  // -----------------------------
  // Initial Calculation
  // -----------------------------

  calculateCash();
});
