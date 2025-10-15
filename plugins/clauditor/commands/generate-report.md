---
description: Generate a professional HTML report from assessment results in the conversation
model: inherit
---

Review the current conversation history and generate a comprehensive HTML assessment report using the standardized template.

## Instructions

1. **Analyze the conversation** for assessment results from any of these commands:
   - `/architecture-assessment`
   - `/generic-code-assessment`
   - `/java-security-assessment`

   Extract the markdown content from these assessments to use as the report body.

2. **Generate an HTML report** using the exact template structure below:
   - Use the standardized HTML template provided in step 3
   - Replace placeholder values with actual data from the assessment:
     - `{{ASSESSMENT_TYPE}}` - Type of assessment (e.g., "Architecture Assessment", "Security Assessment", "Code Quality Assessment")
     - `{{TECH_STACK}}` - Technology stack analyzed (e.g., "JavaScript", "Java", "Python")
     - `{{TARGET_DIR}}` - Directory that was analyzed (e.g., ".", "/src", etc.)
     - `{{TIMESTAMP}}` - Current date/time in format: "M/D/YYYY h:mm:ss A"
     - `{{MODEL}}` - Claude model used (e.g., "claude-sonnet-4-5-20250929")
     - `{{SESSION_ID}}` - Generate a session ID in format: "YYYY-MM-DD-HHmmss-XXXX" where XXXX is random hex
     - `{{MARKDOWN_CONTENT}}` - The full markdown assessment content from the conversation
     - `{{FILENAME}}` - Filename for PDF export: "assessment-report-{{SESSION_ID}}.pdf"
     - `{{MD_FILENAME}}` - Filename for markdown download: "assessment-report-{{SESSION_ID}}.md"
   - Keep all CSS styling, JavaScript functions, and structure exactly as provided
   - The markdown content should be inserted as-is (Claude Code will write it directly, no need for marked.js conversion)

3. **HTML Template Structure**:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Assessment Report - {{ASSESSMENT_TYPE}}</title>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js"></script>
    <style>
        /* Reset and Base Styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary-color: #2c3e50;
            --secondary-color: #3498db;
            --text-dark: #2c3e50;
            --text-light: #5a6c7d;
            --bg-light: #f8f9fa;
            --border-color: #dee2e6;
            --success-color: #27ae60;
            --warning-color: #f39c12;
            --danger-color: #e74c3c;
        }

        body {
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.4;
            color: var(--text-dark);
            background: white;
            margin: 0;
            padding: 0;
            font-size: 14px;
        }

        /* Document Container */
        .document {
            max-width: 1056px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            min-height: 100vh;
        }

        /* Export Buttons */
        .export-buttons {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            gap: 10px;
        }

        .export-btn {
            background: var(--secondary-color);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.3s;
        }

        .export-btn:hover {
            background: #2980b9;
        }

        /* Cover Page */
        .cover-page {
            background: white;
            color: var(--text-dark);
            text-align: center;
            padding: 80px 60px;
            padding-bottom: 0;
        }

        .cover-page h1 {
            font-size: 2.5em;
            font-weight: 400;
            margin-bottom: 30px;
            letter-spacing: -0.5px;
            color: var(--primary-color);
            border-bottom: 3px solid var(--secondary-color);
            padding-bottom: 20px;
            display: inline-block;
        }

        .cover-page .subtitle {
            font-size: 1.3em;
            color: var(--text-light);
            margin-bottom: 60px;
            font-weight: 300;
        }

        .cover-page .meta-info {
            width: 100%;
            color: var(--text-light);
        }

        .cover-page .meta-row {
            margin: 20px 0;
            font-size: 1em;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 15px;
        }

        .cover-page .meta-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }

        .cover-page .meta-label {
            font-weight: 600;
            color: var(--text-light);
            text-transform: uppercase;
            font-size: 1em;
            letter-spacing: 0.5px;
        }

        .cover-page .meta-value {
            font-weight: 400;
            color: var(--text-dark);
            text-align: right;
            flex: 1;
            margin-left: 20px;
        }

        /* Main Content */
        .main-content {
            padding: 60px;
            line-height: 1.4;
        }

        .main-content h1 {
            font-size: 1.75em;
            color: var(--primary-color);
            margin: 30px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 2px solid var(--secondary-color);
            page-break-after: avoid;
            font-weight: 400;
            line-height: 1.2;
        }

        .main-content h1:first-child {
            margin-top: 0;
        }

        .main-content h2 {
            font-size: 1.375em;
            color: var(--primary-color);
            margin: 25px 0 12px 0;
            padding-bottom: 6px;
            border-bottom: 1px solid var(--border-color);
            page-break-after: avoid;
            font-weight: 500;
            line-height: 1.2;
        }

        .main-content h3 {
            font-size: 1.125em;
            color: var(--text-dark);
            margin: 20px 0 10px 0;
            page-break-after: avoid;
            font-weight: 600;
            line-height: 1.2;
        }

        .main-content h4 {
            font-size: 1em;
            color: var(--text-dark);
            margin: 15px 0 8px 0;
            page-break-after: avoid;
            font-weight: 600;
            line-height: 1.2;
        }

        .main-content h5 {
            font-size: 1em;
            color: var(--text-light);
            margin: 12px 0 6px 0;
            page-break-after: avoid;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            line-height: 1.2;
        }

        .main-content h6 {
            font-size: 1em;
            color: var(--text-light);
            margin: 10px 0 5px 0;
            page-break-after: avoid;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            line-height: 1.2;
        }

        .main-content p {
            margin: 8px 0;
            text-align: left;
            hyphens: auto;
            font-size: 1em;
            line-height: 1.4;
        }

        .main-content ul, .main-content ol {
            margin: 10px 0;
            padding-left: 24px;
        }

        .main-content li {
            margin: 4px 0;
            line-height: 1.3;
            font-size: 1em;
        }

        .main-content li p {
            margin: 4px 0;
        }

        .main-content code {
            background: var(--bg-light);
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            font-size: 1em;
            color: var(--danger-color);
            border: 1px solid var(--border-color);
        }

        .main-content pre {
            background: var(--bg-light);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 16px;
            overflow-x: auto;
            margin: 12px 0;
            page-break-inside: avoid;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .main-content pre code {
            background: none;
            padding: 0;
            color: var(--text-dark);
            font-size: 0.9em;
            line-height: 1.3;
            border: none;
        }

        .main-content blockquote {
            border-left: 3px solid var(--secondary-color);
            padding: 12px 16px;
            margin: 12px 0;
            font-style: italic;
            color: var(--text-light);
            background: var(--bg-light);
            border-radius: 0 4px 4px 0;
            font-size: 1em;
            line-height: 1.4;
        }

        .main-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            page-break-inside: avoid;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-radius: 4px;
            overflow: hidden;
            font-size: 1em;
        }

        .main-content th {
            background: var(--primary-color);
            color: white;
            padding: 10px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 1em;
            line-height: 1.3;
        }

        .main-content td {
            padding: 8px 12px;
            border: 1px solid var(--border-color);
            vertical-align: top;
            font-size: 1em;
            line-height: 1.3;
        }

        .main-content tr:nth-child(even) {
            background: var(--bg-light);
        }

        .main-content tr:hover {
            background: #f1f3f5;
        }

        /* Footer */
        .document-footer {
            background: var(--bg-light);
            padding: 30px 60px;
            text-align: center;
            color: var(--text-light);
            border-top: 2px solid var(--border-color);
            margin-top: 60px;
        }

        /* Print Styles */
        @media print {
            body {
                background: white;
            }

            .document {
                box-shadow: none;
                max-width: 100%;
            }

            .cover-page {
                page-break-after: always;
            }

            .main-content h1 {
                page-break-before: auto;
                page-break-after: avoid;
            }

            .main-content h2 {
                page-break-before: auto;
                page-break-after: avoid;
            }

            .main-content pre,
            .main-content table,
            .main-content blockquote {
                page-break-inside: avoid;
            }

            .no-print, .export-buttons {
                display: none !important;
            }

            a {
                color: inherit;
                text-decoration: none;
            }
        }

        /* Screen-only styles */
        @media screen {
            body {
                background: #e9ecef;
                padding: 20px 0;
            }

            .document {
                margin: 20px auto;
            }
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
            .cover-page {
                padding: 40px 30px;
            }

            .cover-page h1 {
                font-size: 2em;
            }

            .main-content {
                padding: 40px 30px;
            }

            .main-content h1 {
                font-size: 1.6em;
            }

            .main-content h2 {
                font-size: 1.4em;
            }

            .main-content pre {
                padding: 20px;
                margin: 20px 0;
            }
        }

        @media (max-width: 480px) {
            .cover-page {
                padding: 30px 20px;
            }

            .main-content {
                padding: 30px 20px;
            }

            .cover-page .meta-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 8px;
            }

            .cover-page .meta-value {
                text-align: left;
                margin-left: 0;
            }

            .export-buttons {
                position: relative;
                top: 0;
                right: 0;
                margin: 20px;
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="document">
        <!-- Export Buttons -->
        <div class="export-buttons no-print">
            <button class="export-btn" onclick="exportToPDF()">Export as PDF</button>
        </div>

        <!-- Cover Page -->
        <div class="cover-page">
            <h1>Code Assessment Report</h1>
            <div class="subtitle">{{ASSESSMENT_TYPE}}</div>

            <div class="meta-info">
                <div class="meta-row">
                    <span class="meta-label">Technology Stack:</span>
                    <span class="meta-value">{{TECH_STACK}}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Target Directory:</span>
                    <span class="meta-value">{{TARGET_DIR}}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Generated at:</span>
                    <span class="meta-value">{{TIMESTAMP}}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Model:</span>
                    <span class="meta-value">{{MODEL}}</span>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content" id="report-content">
            <div id="summary-content">
{{MARKDOWN_CONTENT}}
            </div>
        </div>

        <!-- Footer -->
        <div class="document-footer">
            <p>Generated with Clauditor Assessment Tool</p>
            <p>2025 - Confidential Document</p>
        </div>
    </div>

    <script>
        // Markdown content from the assessment
        const markdownSummary = `{{MARKDOWN_CONTENT}}`;

        // Render markdown to HTML
        document.addEventListener('DOMContentLoaded', function() {
            const summaryElement = document.getElementById('summary-content');
            if (summaryElement && markdownSummary) {
                summaryElement.innerHTML = marked.parse(markdownSummary);
            }
        });

        // Export to PDF function
        function exportToPDF() {
            const element = document.querySelector('.document');
            const options = {
                margin: [0.5, 0.5],
                filename: '{{FILENAME}}',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            html2pdf().from(element).set(options).save();
        }
    </script>
</body>
</html>
```

4. **Save the report** to: `reports/clauditor-report-[YYYY-MM-DD-HHmmss].html`
   - Create the `reports/` directory if it doesn't exist
   - Use current timestamp in filename (same format as {{SESSION_ID}})

5. **Confirm completion** by showing the user:
   - The report file path
   - A brief summary of what was included
   - Suggestion to open in browser

## Notes

- The template includes marked.js for markdown-to-HTML conversion in the browser
- Keep all placeholder variables exactly as shown ({{VARIABLE_NAME}})
- The markdown content should be escaped properly for JavaScript string insertion
- Export buttons allow users to download PDF or markdown versions
- The template is fully responsive and print-optimized

If no assessment results are found in the conversation, inform the user to run assessment commands first ("/architecture-assessment", "/generic-assessment", "/java-security-assessment").
