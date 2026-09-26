document.addEventListener("DOMContentLoaded", () => {
  const denominationInputs = document.querySelectorAll(".denomination-input");

  const expectedCashInput = document.getElementById("expected-cash-input");

  const remainingCashInput = document.getElementById("remaining-cash-input");

  const remitDisplay = document.getElementById("remit-amount");

  const actualCashDisplay = document.getElementById("actual-cash");

  const differenceDisplay = document.getElementById("difference");

  const differenceStatus = document.getElementById("difference-status");

  const remitValidation = document.getElementById("remit-validation");

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

  expectedCashInput.addEventListener("input", calculateCash);

  remainingCashInput.addEventListener("input", calculateCash);

  denominationInputs.forEach((input) => {
    input.addEventListener("input", calculateCash);
  });

  calculateCash();
});
