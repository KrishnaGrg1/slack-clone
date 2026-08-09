# Common Zsh Git aliases

```bash
# =========================
# STATUS
# =========================

gst       git status
gss       git status --short
gclean    git clean -fd

# =========================
# ADD
# =========================

ga        git add
gaa       git add --all
gap       git add --patch

# =========================
# COMMIT
# =========================

gc        git commit
gcm       git commit -m
gca       git commit --amend
gcan      git commit --amend --no-edit
gcf       git commit --fixup

# =========================
# BRANCH
# =========================

gb        git branch
gba       git branch -a
gbd       git branch -d
gbD       git branch -D
gbm       git branch -m
gbda      git branch --merged

# =========================
# SWITCH / CHECKOUT
# =========================

gco       git checkout
gcb       git checkout -b

gsw       git switch
gswc      git switch -c

# =========================
# PUSH
# =========================

gp        git push
gpf       git push --force-with-lease
gpoat     git push origin --all
gpod      git push origin --delete

# =========================
# PULL / FETCH
# =========================

gl        git pull
gup       git pull --rebase
gf        git fetch
gfa       git fetch --all --prune

# =========================
# DIFF
# =========================

gd        git diff
gds       git diff --staged
gdca      git diff --cached

# =========================
# LOG
# =========================

glg       git log --stat
glgg      git log --graph
glog      git log --oneline --decorate --graph
glo       git log --oneline
gcount    git shortlog -sn

# =========================
# MERGE
# =========================

gm        git merge
gma       git merge --abort
gmc       git merge --continue

# =========================
# REBASE
# =========================

grb       git rebase
grbi      git rebase -i

# These don't always have short aliases:
git rebase --continue
git rebase --abort
git rebase --skip

# =========================
# RESET
# =========================

grh       git reset HEAD
grhh      git reset --hard HEAD

# Soft reset (usually no standard OMZ alias)
git reset --soft HEAD~1

# Mixed reset
git reset HEAD~1

# Hard reset
git reset --hard HEAD~1

# =========================
# RESTORE
# =========================

grs       git restore
grst      git restore --staged

# =========================
# CHERRY-PICK
# =========================

gcp       git cherry-pick

# Abort
git cherry-pick --abort

# Continue
git cherry-pick --continue

# =========================
# STASH
# =========================

gsta      git stash
gstaa     git stash apply
gstc      git stash clear
gstd      git stash drop
gstl      git stash list
gstp      git stash pop
gsts      git stash show

# =========================
# REMOTE
# =========================

gr        git remote
grv       git remote -v

# =========================
# TAG
# =========================

gt        git tag

# =========================
# SHOW
# =========================

gsh       git show

# =========================
# CLONE
# =========================

gcl       git clone

# =========================
# REVERT
# =========================

git revert <commit>

# =========================
# COMMON GIT COMMANDS
# =========================

git reflog
git bisect
git blame
git worktree
git submodule
git archive
```

## example
```bash
gst
gaa
gcm "add channel membership"
gp
```