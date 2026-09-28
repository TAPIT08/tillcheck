document.addEventListener("DOMContentLoaded", () => {
  let cashMovements = [];

  const denominationInputs = document.querySelectorAll(".denomination-input");

  const expectedCashInput = document.getElementById("expected-cash-input");

  const remainingCashInput = document.getElementById("remaining-cash-input");

  const remitDisplay = document.getElementById("remit-amount");

  const actualCashDisplay = document.getElementById("actual-cash");

  const differenceDisplay = document.getElementById("difference");

  const differenceStatus = document.getElementById("difference-status");

  const remitValidation = document.getElementById("remit-validation");

  const movementTypeInput = document.getElementById("movement-type");

  const movementAmountInput = document.getElementById("movement-amount");

  const movementReasonInput = document.getElementById("movement-reason");

  const addMovementButton = document.getElementById("add-movement-button");

  const movementList = document.getElementById("movement-list");

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  }

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

      subtotalElement.textContent = formatCurrency(subtotal);
    });

    actualCashDisplay.textContent = formatCurrency(actualCash);

    calculateDifference(actualCash);

    calculateRemit(actualCash);
  }

  function calculateDifference(actualCash) {
    const expectedCash = Number(expectedCashInput.value) || 0;

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

  function renderMovements() {
    movementList.innerHTML = "";

    if (cashMovements.length === 0) {
      movementList.innerHTML = `<p>No cash movements recorded.</p>`;

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

  expectedCashInput.addEventListener("input", calculateCash);

  remainingCashInput.addEventListener("input", calculateCash);

  denominationInputs.forEach((input) => {
    input.addEventListener("input", calculateCash);
  });

  addMovementButton.addEventListener("click", addMovement);

  calculateCash();
});
