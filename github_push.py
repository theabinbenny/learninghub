import os
import subprocess
import sys

def run_command(command, cwd=None):
    """Runs a shell command and returns its output."""
    try:
        # Use shell=True to handle multiple arguments in the command string
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True, cwd=cwd)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"Output: {e.output}")
        print(f"Stderr: {e.stderr}")
        return None

def main():
    # Set the repository path to the script's directory
    repo_path = os.path.dirname(os.path.abspath(__file__))
    
    print(f"Checking for changes in: {repo_path}")
    
    # 1. Check if it's a git repo
    if not os.path.exists(os.path.join(repo_path, ".git")):
        print("Error: This directory is not a git repository.")
        return

    # 2. Check for changes
    status = run_command("git status --short", cwd=repo_path)
    if not status:
        print("No changes to push.")
        # Optionally, still push if the user wants to sync with remote
        # but usually "push data" implies pushing new changes.
        return

    print("Changes detected:")
    print(status)
    
    # 3. Add all files
    print("Staging changes...")
    run_command("git add .", cwd=repo_path)
    
    # 4. Commit
    commit_msg = "Update website data"
    if len(sys.argv) > 1:
        commit_msg = " ".join(sys.argv[1:])
    
    print(f"Committing with message: '{commit_msg}'")
    run_command(f'git commit -m "{commit_msg}"', cwd=repo_path)
    
    # 5. Push
    # We'll try pushing to 'main'. If it fails, the user might need to specify the branch or auth.
    print("Pushing to GitHub (origin main)...")
    push_result = run_command("git push origin main", cwd=repo_path)
    
    if push_result is not None:
        print("Push successful!")
    else:
        print("Push failed. Please check your internet connection and GitHub credentials.")

if __name__ == "__main__":
    main()
