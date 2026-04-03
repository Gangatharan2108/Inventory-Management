console.log("Inventory System Loaded");

document.addEventListener("DOMContentLoaded", function () {

    // Delete confirmation
    const deleteButtons = document.querySelectorAll(".delete-btn");

    deleteButtons.forEach(function (btn) {
        btn.addEventListener("click", function (e) {
            if (!confirm("Are you sure you want to delete this record?")) {
                e.preventDefault();
            }
        });
    });

    // Auto hide alerts
    const alerts = document.querySelectorAll(".alert");
    setTimeout(() => {
        alerts.forEach(alert => alert.remove());
    }, 4000);

});
