path = "C:/Users/mohul/.gemini/antigravity/scratch/brandguard-ai/round1-submission/generate_pdf.py"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# Replace metadata
text = text.replace(
    'Paragraph("<b>EVALUATION:</b> 100 Pts Criteria", table_cell)',
    'Paragraph("<b>LEADER / AUTHOR:</b> C R Mohul Ram", table_cell)'
)

# Replace Section 9
text = text.replace(
    'Paragraph("<b>[Team Leader Name]</b>", table_cell_bold)',
    'Paragraph("<b>C R Mohul Ram</b> (Team Leader)", table_cell_bold)'
)

# Replace Section 12
text = text.replace(
    'Paragraph("[Team Leader Full Name]", table_cell)',
    'Paragraph("<b>C R Mohul Ram</b>", table_cell_bold)'
)

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print("Replacement complete.")
