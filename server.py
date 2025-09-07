#!/usr/bin/env python3
"""
Simple HTTP server for the Financial Status Tracker app
Run this file to start a local development server
"""

import http.server
import socketserver
import webbrowser
import os
from pathlib import Path

PORT = 8000

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=Path(__file__).parent, **kwargs)
    
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def start_server():
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        print(f"🚀 Financial Status Tracker is running!")
        print(f"📊 Open your browser and go to: http://localhost:{PORT}")
        print(f"💡 Press Ctrl+C to stop the server")
        print("="*50)
        
        try:
            # Try to open browser automatically
            webbrowser.open(f'http://localhost:{PORT}')
        except:
            pass
            
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped.")
            httpd.shutdown()

if __name__ == "__main__":
    start_server()