# --- 1. Making the Repo ---

## 1.a Existing local project, putting it on GitHub for the first time
    # Navigate to your existing project directory
    cd /path/to/your/existing/project

    git init                               # Initializes a new Git repository in the current directory
    git add .                              # Stages all files in the current directory
    git commit -m "Initial project commit" # Commits staged files to your local repository
    git branch -M main                     # Renames the default branch (often 'master') to 'main'
    git remote add origin https://github.com/user/project.git # Connects your local repo to the remote GitHub repo
    git push -u origin main                # Pushes your local 'main' branch to the remote and sets it as upstream

## 1.b Clone an existing project from GitHub
    git clone https://github.com/user/project.git
    cd project                             # Navigate into the cloned project directory

# --- 2. Day-to-Day Development: Creating and Working on a Feature Branch ---

# You'll mostly work by creating branches directly from 'main'
# The convention 'feature/your-awesome-feature' is good.

# 2.1 Start a new feature/fix:
    git checkout main                      # Always start from the latest 'main'
    git pull origin main                   # Ensure your local 'main' is fully up-to-date with the remote
    git checkout -b feature/your-awesome-feature # Creates a new branch and switches to it

# 2.2 Work on your feature/fix:
    # ... Make your code changes here ...

    git add .                              # Stage your changes
    git commit -m "feat: Implement X for feature/your-awesome-feature" # Commit your changes
    git push origin feature/your-awesome-feature # Push your local feature branch to GitHub

    # Repeat add, commit, push as you make progress on your feature.

# --- 3. Integrating Your Feature: Pull Request to Main ---

# 3.1 Open a Pull Request (PR) on GitHub:
    # Go to your repository on GitHub.com.
    # You will see a prompt to create a Pull Request from 'feature/your-awesome-feature'.
    # IMPORTANT: Ensure the "base branch" is 'main' and the "compare branch" is 'feature/your-awesome-feature'.
    # Add a clear title and description.
    # Request reviews from team members.
    # Your CI/CD pipeline should run automated tests on this PR.

# 3.2 Review and Merge the PR:
    # Once the PR is approved and all checks pass, merge it into 'main' on GitHub.
    # You can choose 'Merge commit', 'Squash and merge', or 'Rebase and merge' depending on team preference.

# --- 4. Post-Merge Cleanup and Synchronization (for your local repo) ---

# 4.1 Delete the feature/bugfix branch after merging to main:
    git checkout main                      # Switch to main to clean up
    git pull origin main                   # Pull the merged changes (and possibly the PR merge commit) into your local main
    git branch -d feature/your-awesome-feature # Delete the local feature branch
    git push origin --delete feature/your-awesome-feature # Delete the remote feature branch

    # You are now back on 'main', and 'main' contains your newly merged feature.
    # All developers would then pull 'main' to get these updates.

# --- 5. Release: Tagging Main (When you decide to cut a new version) ---

# This step is independent of individual feature merges. You do this when you're ready
# to officially mark a point in 'main's history as a new release version.

# 5.1 Ensure your local 'main' is the absolute latest:
    git checkout main
    git pull origin main # Critical: Make sure your local main is fully synced with the remote

# 5.2 Create and push the release tag:
    git tag -a v1.0.0 -m "Release version 1.0.0" # Create an annotated tag on the current commit of 'main'
    git push origin v1.0.0 # Push the tag to GitHub

    # Go to GitHub's 'Releases' section to create a formal release from this tag.

# --- 6. Hotfixes (if a critical bug is found in production) ---
# Hotfixes are just another feature/bugfix branch, but created from 'main' and merged quickly.

# 6.1 Create hotfix branch from main:
    git checkout main
    git pull origin main
    git checkout -b fix/critical-bug-v1.0.0.1 # Naming convention for hotfix

# 6.2 Implement fix, commit, push:
    # ... make changes ...
    git add .
    git commit -m "fix: Resolve critical bug in module X"
    git push origin fix/critical-bug-v1.0.0.1

# 6.3 Open PR from fix/critical-bug-v1.0.0.1 to main. Review & Merge on GitHub.

# 6.4 After merging hotfix to main, tag main with a patch version:
    git checkout main
    git pull origin main # Get the merged hotfix
    git tag -a v1.0.1 -m "Hotfix for v1.0.0: Critical bug fix" # Increment patch version
    git push origin v1.1.0 # Push the new tag

# 6.5 Clean up hotfix branch:
    git branch -d fix/critical-bug-v1.0.0.1
    git push origin --delete fix/critical-bug-v1.0.0.1