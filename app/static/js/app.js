document.addEventListener("DOMContentLoaded", () => {

    const denominationInputs = document.querySelectorAll(
        ".denomination-input"
    );

    const expectedCashInput = document.getElementById(
        "expected-cash-input"
    );

    const actualCashDisplay = document.getElementById(
        "actual-cash"
    );

    const differenceDisplay = document.getElementById(
        "difference"
    );

    const differenceStatus = document.getElementById(
        "difference-status"
    );


    function formatCurrency(amount) {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP"
        }).format(amount);
    }


    function calculateCash() {

        let actualCash = 0;


        denominationInputs.forEach(input => {

            const denomination = Number(
                input.dataset.value
            );

            const quantity = Number(
                input.value
            ) || 0;


            const subtotal = denomination * quantity;

            actualCash += subtotal;


            const subtotalElement = document.getElementById(
                `subtotal-${denomination}`
            );

            subtotalElement.textContent =
                formatCurrency(subtotal);
        });


        actualCashDisplay.textContent =
            formatCurrency(actualCash);


        calculateDifference(actualCash);
    }


    function calculateDifference(actualCash) {

        const expectedCash =
            Number(expectedCashInput.value) || 0;


        const difference =
            actualCash - expectedCash;


        differenceDisplay.textContent =
            formatCurrency(difference);


        if (difference === 0) {

            differenceStatus.textContent =
                "No difference";

        } else if (difference < 0) {

            differenceStatus.textContent =
                "Shortage";

        } else {

            differenceStatus.textContent =
                "Overage";
        }
    }


    denominationInputs.forEach(input => {

        input.addEventListener(
            "input",
            calculateCash
        );

    });


    expectedCashInput.addEventListener(
        "input",
        calculateCash
    );


    calculateCash();

});