// In backend/static/js/resume-analysis.js
document.addEventListener('DOMContentLoaded', () => {
    const uploadButton = document.getElementById('upload-button');
    const resumeInput = document.getElementById('resume-input');
    const fileNameDisplay = document.getElementById('file-name-display');
    const resultsDiv = document.getElementById('analysis-results');

    uploadButton.addEventListener('click', () => resumeInput.click());

    resumeInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            fileNameDisplay.textContent = `Selected file: ${file.name}`;
            uploadAndAnalyze(file);
        }
    });

    // In backend/static/js/resume-analysis.js
function uploadAndAnalyze(file) {
    const formData = new FormData();
    formData.append('resume', file);
    resultsDiv.innerHTML = "<p>Analyzing your resume... please wait.</p>";

    fetch('/analyze-resume', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            resultsDiv.innerHTML = `<p>Error: ${data.error}</p>`;
        } else {
            // --- THIS IS THE NEW, IMPORTANT LINE ---
            // Save the full text to the browser's session storage
            sessionStorage.setItem('savedResumeText', data.full_text);
            
            const analysis = data.analysis;
            resultsDiv.innerHTML = `<h3>Analysis Complete!</h3>` + renderJsonAsHtml(analysis);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        resultsDiv.innerHTML = `<p>An error occurred. Is the server running?</p>`;
    });
}

    // Dynamic JSON Renderer
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