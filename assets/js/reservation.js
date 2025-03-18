document.addEventListener("DOMContentLoaded", function() {
    // Initialize Flatpickr on the check-in input with range mode
    const fp = flatpickr("#checkin", {
        mode: "range",          // Enables drag-to-select range
        showMonths: 2,          // Displays current and next month
        dateFormat: "Y-m-d",    // Standard format for form submission
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length === 2) {
                const [start, end] = selectedDates;
                // Update check-in input with start date
                document.getElementById("checkin").value = instance.formatDate(start, "F j, Y");
                // Update check-out input with end date
                document.getElementById("checkout").value = instance.formatDate(end, "F j, Y");
            }
        }
    });

    // Make check-in icon clickable
    const checkinIcon = document.querySelector("#checkin + .icon-calendar");
    checkinIcon.addEventListener("click", function() {
        fp.open();
    });

    // Make check-out icon clickable (opens the same calendar for range selection)
    const checkoutIcon = document.querySelector("#checkout + .icon-calendar");
    checkoutIcon.addEventListener("click", function() {
        fp.open();
    });
}); 