---
name: generate-report
description: Generate a professional HTML report from assessment results in the conversation
---

Review the current conversation history and generate a comprehensive HTML assessment report.

## Instructions

1. **Analyze the conversation** for assessment results from any of these commands:
   - `/architecture-assessment`
   - `/generic-code-assessment`
   - `/java-security-assessment`
   
   

2. **Generate an HTML report** with this structure:
   - Professional gradient header with project info and timestamp
   - Executive summary with issue counts by severity
   - Sections for each assessment type found in the conversation
   - Each finding should include: title, severity, description, location, impact, and recommendation
   - Remediation plan with phased approach
   - Styled with modern CSS (purple gradient theme, card-based layout, severity badges)

3. **Save the report** to: `reports/clauditor-report-[YYYY-MM-DD-HHmmss].html`
   - Create the `reports/` directory if it doesn't exist
   - Use current timestamp in filename

4. **Confirm completion** by showing the user:
   - The report file path
   - A brief summary of what was included
   - Suggestion to open in browser

If no assessment results are found in the conversation, inform the user to run assessment commands first.
