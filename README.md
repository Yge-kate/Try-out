# Financial Status Tracker

Simple Flask app to track income and expenses and view summaries.

## Quickstart

1. Install dependencies:

```bash
python3 -m pip install --user -r requirements.txt
# If PATH lacks ~/.local/bin, you may add:
# export PATH="$HOME/.local/bin:$PATH"
```

2. Run the app:

```bash
export FLASK_APP=cli:app
python3 -m flask init-db
python3 -m flask seed-demo
export FLASK_APP=app:app
python3 -m flask run --port 5000
```

3. Open `http://localhost:5000` in your browser.

## Project Structure

- `app.py` - Flask application factory and routes
- `templates/` - HTML templates
- `static/` - Styles and client assets
- `requirements.txt` - Python dependencies

# Try-out
This is my first try out app!!
I want use this app to track my financial status on monthly basis 
