document.addEventListener('DOMContentLoaded', () => {
    // UI Views
    const searchView = document.getElementById('search-view');
    const insightsView = document.getElementById('insights-view');

    // Buttons and Inputs
    const searchButton = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const backButton = document.getElementById('back-to-search-btn');
    
    // Content Area
    const resultsContent = document.getElementById('company-insights-content');

    // --- EVENT LISTENERS ---
    searchButton.addEventListener('click', () => {
        const companyName = searchInput.value.trim();
        if (companyName) {
            getCompanyInsights(companyName);
        }
    });
    
    // Allow pressing Enter to search
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            searchButton.click();
        }
    });

    backButton.addEventListener('click', () => {
        // Switch back to the search view
        insightsView.classList.add('hidden');
        searchView.classList.remove('hidden');
    });

    // --- API CALL FUNCTION (Logic is the same, UI updates are different) ---
    function getCompanyInsights(companyName) {
        resultsContent.innerHTML = "<p>Fetching insights, please wait...</p>";
        
        // Switch to the results view
        searchView.classList.add('hidden');
        insightsView.classList.remove('hidden');

        // This fetch call goes to your Node.js server on port 3000
        fetch(`/api/company-insights/${companyName}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                resultsContent.innerHTML = `<p>Error: ${data.error}</p>`;
            } else {
                resultsContent.innerHTML = `<h3>Insights for ${companyName}</h3>` + renderJsonAsHtml(data);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            resultsContent.innerHTML = `<p>An error occurred. Make sure your Node.js server is running on port 3000.</p>`;
        });
    }

    // Dynamic JSON Renderer (same as before)
    function renderJsonAsHtml(data) {
        if (typeof data !== 'object' || data === null) {
            return document.createTextNode(data).textContent;
        }
        if (Array.isArray(data)) {
            let listItems = data.map(item => `<li>${renderJsonAsHtml(item)}</li>`).join('');
            return `<ul>${listItems}</ul>`;
        }
        let objectItems = Object.entries(data).map(([key, value]) => {
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
            return `<li><strong>${formattedKey}:</strong> ${renderJsonAsHtml(value)}</li>`;
        }).join('');
        return `<ul>${objectItems}</ul>`;
    }
});