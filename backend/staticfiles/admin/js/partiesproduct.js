document.addEventListener('DOMContentLoaded', function () {

    const productField = document.getElementById('id_product');
    const partyField = document.getElementById('id_party');

    function fetchPrice() {

        const productId = productField.value;
        const partyId = partyField.value;

        if (productId && partyId) {

            fetch(`/get-price/?product_id=${productId}&party_id=${partyId}`)
                .then(response => response.json())
                .then(data => {

                    if (data.buying_price) {
                        document.getElementById('id_buying_price').value = data.buying_price;
                        document.getElementById('id_selling_price').value = data.selling_price;
                    } else {
                        document.getElementById('id_buying_price').value = '';
                        document.getElementById('id_selling_price').value = '';
                    }

                });
        }
    }

    productField.addEventListener('change', fetchPrice);
    partyField.addEventListener('change', fetchPrice);

});
