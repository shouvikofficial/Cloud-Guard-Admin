// This file contains functions for handling table data, including sorting, filtering, and pagination.

document.addEventListener('DOMContentLoaded', function() {
    const table = document.getElementById('data-table');
    const searchInput = document.getElementById('search-input');
    const rows = table.getElementsByTagName('tr');

    // Function to filter table rows based on search input
    function filterTable() {
        const filter = searchInput.value.toLowerCase();
        for (let i = 1; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName('td');
            let rowVisible = false;
            for (let j = 0; j < cells.length; j++) {
                if (cells[j].textContent.toLowerCase().includes(filter)) {
                    rowVisible = true;
                    break;
                }
            }
            rows[i].style.display = rowVisible ? '' : 'none';
        }
    }

    // Function to sort table by column
    function sortTable(columnIndex) {
        const sortedRows = Array.from(rows).slice(1).sort((a, b) => {
            const cellA = a.getElementsByTagName('td')[columnIndex].textContent;
            const cellB = b.getElementsByTagName('td')[columnIndex].textContent;
            return cellA.localeCompare(cellB);
        });

        // Append sorted rows to the table
        sortedRows.forEach(row => table.appendChild(row));
    }

    // Event listeners
    searchInput.addEventListener('keyup', filterTable);
    const headers = table.getElementsByTagName('th');
    for (let i = 0; i < headers.length; i++) {
        headers[i].addEventListener('click', () => sortTable(i));
    }
});