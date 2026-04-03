document.addEventListener("input", function () {

    let total = 0;
    let quantities = document.querySelectorAll(".quantity");
    let prices = document.querySelectorAll(".price");

    for (let i = 0; i < quantities.length; i++) {
        let qty = parseFloat(quantities[i].value) || 0;
        let price = parseFloat(prices[i].value) || 0;
        total += qty * price;
    }

    let totalField = document.querySelector("#id_total_amount");
    if (totalField) {
        totalField.value = total.toFixed(2);
    }
});
