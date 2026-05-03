# Capstone Project Report — required template

The /report route MUST follow this exact structure (extracted from the
provided `CAPSTONE PROJECT REPORT.docx`).

## Title page (front matter)
- Title of Project: **Pratidhwani — Predictive Carbon-Aware Serverless Gateway**
- Sub-line: *Synopsis submitted for the partial fulfilment of the degree of*
  **BACHELOR OF TECHNOLOGY (CSE)**
- Name of Student: **Anshuman Mohanty**
- Registration Number: **GF202217744**
- Course with Specialization: **B.Tech CSE — Cloud Computing**
- Semester: *(placeholder — leave a `[Semester]` token)*
- Capstone Mentor: **Mr. Ashish**
- Footer block:
  - **YOGANANDA SCHOOL OF AI, COMPUTERS AND DATA SCIENCES**
  - **SHOOLINI UNIVERSITY OF BIOTECHNOLOGY AND MANAGEMENT SCIENCES**
  - **SCIENCES SOLAN, H.P., INDIA**

## Front-matter sections (each on its own page on print)
1. Acknowledgement
2. Abstract
3. Table of Contents (auto-generated from h2/h3)
4. List of Figures
5. List of Tables
6. List of Abbreviations  *(add this — useful for FaaS/CaaS/PQC etc.)*

## Body chapters (numbered, each starts a new page on print)
1. Introduction & Problem Definition
2. System Requirements
3. System Architecture & Design
4. Technology Stack
5. Implementation
6. Algorithms / Models  *(forecaster + scorer math goes here)*
7. Testing
8. Results & Performance Analysis
9. Deployment
10. Challenges & Solutions
11. Conclusion & Future Scope

## Required Q&A appendix — answer each in 1–2 paragraphs
1. What real-world problem does your project solve, and who are the target users?
2. Why did you choose this technology stack over other alternatives?
3. Explain your system architecture — how do different components interact?
4. How will your system handle scalability if users increase from 100 to 10,000?
5. What security measures have you implemented (authentication, data protection, etc.)?
6. What are the biggest challenges you faced during development, and how did you solve them?
7. How did you test your system, and how do you ensure it is reliable?
8. If your system fails in production, how will you handle debugging and recovery?
9. What are the limitations of your project, and how can it be improved further?
10. If you had to deploy this as a real product or startup, what would be your next steps?

## References (last)
IEEE-style numbered list, generated from `/docs/literature.md` BibTeX.

## Print rules
- A4, 25 mm margins (left 30 mm for binding), 12pt serif body, 1.5 line spacing.
- Page break before each chapter.
- Headers / footers: project name on left, page number on right.
- Hide nav chrome on `@media print`.
- Title page is page-i; front matter Roman numerals; body chapters Arabic.
