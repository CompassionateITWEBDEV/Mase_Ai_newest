# MASE Backend

This project provides a simple backend service for the MASE homecare automation example. It uses **FastAPI** with **SQLite** via SQLAlchemy.

## Setup

1. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`
2. Run the application:
   \`\`\`bash
   uvicorn app.main:app --reload
   \`\`\`

## Testing

Run the test suite with:

\`\`\`bash
pytest
\`\`\`
