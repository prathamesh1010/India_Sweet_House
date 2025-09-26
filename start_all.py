#!/usr/bin/env python3
"""
Complete startup script for India Sweet House Analytics
Starts both backend API and frontend automatically
"""
import subprocess
import sys
import os
import time
import webbrowser
import threading
import signal
from pathlib import Path

class ProcessManager:
    def __init__(self):
        self.processes = []
        self.running = True
        
    def add_process(self, process):
        self.processes.append(process)
        
    def stop_all(self):
        print("\n🛑 Stopping all processes...")
        self.running = False
        for process in self.processes:
            try:
                if process.poll() is None:  # Process is still running
                    process.terminate()
                    process.wait(timeout=5)
            except:
                try:
                    process.kill()
                except:
                    pass
        print("✅ All processes stopped")
        
    def monitor_processes(self):
        while self.running:
            time.sleep(2)
            for i, process in enumerate(self.processes):
                if process.poll() is not None:  # Process has ended
                    print(f"⚠️  Process {i+1} has stopped unexpectedly")
                    self.running = False
                    break

def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    # Check Python dependencies
    try:
        import flask, pandas, numpy, openpyxl
        print("✅ Python dependencies are installed")
    except ImportError as e:
        print(f"❌ Missing Python dependency: {e}")
        print("Installing Python dependencies...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
            print("✅ Python dependencies installed")
        except subprocess.CalledProcessError:
            print("❌ Failed to install Python dependencies")
            return False
    
    # Check Node.js dependencies
    if not os.path.exists("node_modules"):
        print("📦 Installing Node.js dependencies...")
        try:
            subprocess.check_call(["npm", "install"], shell=True)
            print("✅ Node.js dependencies installed")
        except subprocess.CalledProcessError:
            print("❌ Failed to install Node.js dependencies")
            return False
    else:
        print("✅ Node.js dependencies are installed")
    
    return True

def start_backend():
    """Start the Python backend API"""
    print("🚀 Starting Backend API...")
    try:
        # Create uploads directory
        os.makedirs("uploads", exist_ok=True)
        
        # Start backend
        process = subprocess.Popen(
            [sys.executable, "backend_api.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        # Wait for backend to start
        print("⏳ Waiting for backend to start...")
        time.sleep(5)
        
        # Test if backend is running
        try:
            import requests
            response = requests.get("http://localhost:5000/health", timeout=5)
            if response.status_code == 200:
                print("✅ Backend API is running at http://localhost:5000")
                return process
            else:
                print("❌ Backend API failed to start properly")
                return None
        except Exception as e:
            print(f"❌ Backend API test failed: {e}")
            return None
            
    except Exception as e:
        print(f"❌ Failed to start backend: {e}")
        return None

def start_frontend():
    """Start the React frontend"""
    print("🚀 Starting Frontend...")
    try:
        process = subprocess.Popen(
            ["npm", "run", "dev"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1,
            shell=True
        )
        
        # Wait for frontend to start
        print("⏳ Waiting for frontend to start...")
        time.sleep(10)
        
        print("✅ Frontend should be running (check terminal for URL)")
        return process
        
    except Exception as e:
        print(f"❌ Failed to start frontend: {e}")
        return None

def main():
    """Main startup function"""
    print("🏦 India Sweet House - Complete Analytics System")
    print("=" * 60)
    
    # Check dependencies
    if not check_dependencies():
        print("❌ Dependency check failed. Please fix the issues above.")
        return False
    
    # Create process manager
    manager = ProcessManager()
    
    # Setup signal handler for graceful shutdown
    def signal_handler(signum, frame):
        manager.stop_all()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Start backend
        backend_process = start_backend()
        if not backend_process:
            print("❌ Failed to start backend. Exiting.")
            return False
        
        manager.add_process(backend_process)
        
        # Start frontend
        frontend_process = start_frontend()
        if not frontend_process:
            print("❌ Failed to start frontend. Exiting.")
            manager.stop_all()
            return False
        
        manager.add_process(frontend_process)
        
        # Print success message
        print("\n" + "=" * 60)
        print("🎉 System Started Successfully!")
        print("=" * 60)
        print("📊 Frontend: http://localhost:5173 (or check terminal for actual port)")
        print("🔧 Backend API: http://localhost:5000")
        print("📁 Upload your Excel files through the web interface")
        print("\n💡 Supported formats:")
        print("   • data4.xlsx - Raw format (complex layout)")
        print("   • data5.xlsx - Clean format (outlets as rows)")
        print("\n🛑 Press Ctrl+C to stop all services")
        print("=" * 60)
        
        # Open browser
        try:
            webbrowser.open("http://localhost:5173")
        except:
            pass
        
        # Monitor processes
        manager.monitor_processes()
        
    except KeyboardInterrupt:
        print("\n\n🛑 Shutdown requested by user")
        manager.stop_all()
        return True
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        manager.stop_all()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
