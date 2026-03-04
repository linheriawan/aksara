# GIT Iteration

## Setup Bitwarden ssh key
  install Bitwarden 
  -->$ export SSH_AUTH_SOCK=/Users/<user>/Library/Containers/com.bitwarden.desktop/Data/.bitwarden-ssh-agent.sock
  --> make ssh key --> enable SSH agent --> test `$ ssh-add -L` and `$ ssh -T git@github.com`
  --> update repo `$ git remote set-url origin git@github.com:USERNAME/REPO.git`

## do clean slate
```bash
git checkout main
git checkout --orphan clean-main
git add .
git commit -m "main Clean Slate"
git branch -D main
git branch -m main
git push origin main --force-with-lease
```
> the collabolator need do: (matching the rewrite)

```bash
git fetch origin
git checkout main
git reset --hard origin/main
```

> if other branch need clean slate 
```bash
git checkout feature/inprogress
git checkout --orphan clean
git add .
git commit -m "progress Clean Slate"
git branch -D feature/inprogress
git branch -m feature/inprogress
git push origin feature/inprogress --force-with-lease
```

## After feature Delivered (done Pull Request)

```bash
git branch -d feature/inprogress              # remove branch from local
git push origin --delete feature/inprogress   # remove branch from origin

git checkout -b feature/inprogress      # make local branch
git push -u origin feature/inprogress   # push local branch to origin
```

## make tag
```bash
git checkout main
git tag -a v0.1 -m "Release version 0.1"
git push origin v0.1
```

## populate CodeCommit from github


```bash 
aws codecommit create-repository --repository-name ias-ofm  #  Create empty CodeCommit repo via AWS Console first
git clone --mirror git@github.com:username/project.git project-mirror # Clone mirror FROM GitHub (your source)
# Change remote TO CodeCommit (your target)
cd project-mirror
git remote set-url origin https://git-codecommit.ap-southeast-3.amazonaws.com/v1/repos/ias-ofm
git push --mirror   #Push mirror (GitHub unchanged, CodeCommit now populated)

# After Sync
cd ../your-original-project  
git remote add cc https://git-codecommit.ap-southeast-3.amazonaws.com/v1/repos/ias-ofm
git push cc main inprogress  # optional: add CodeCommit as read-only remote
```