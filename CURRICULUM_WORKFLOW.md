# Amplify Curriculum Branching Workflow

This repository uses a simple branching strategy to maintain clean snapshots of your progress through each section of the Amplify curriculum.

## Branch Structure

- `master` - Main development branch where you work on current curriculum section
- `dayXX-complete` - Snapshot branches preserving the completed state of each day

## Current Status

- `day04-complete` - Completed state of day 4 (with navbar)
- `master` - Currently matches day04-complete, ready for day05 work

## Simple Workflow for Each New Curriculum Day

### When Working on a New Day (e.g., Day 5):

1. **Continue working on master branch** (it starts from the previous day's completion)

2. **When you complete the day:**
   ```bash
   # Commit your final changes
   git add .
   git commit -m "day05 complete"
   
   # Create completion snapshot
   git branch day05-complete
   ```

3. **Continue to next day** - just keep working on master!

### To View/Navigate Different Curriculum Sections:

```bash
# List all day branches
git branch | grep "day"

# Switch to any specific day's completed state
git checkout day04-complete

# Return to current work
git checkout master

# Compare changes between days
git diff day04-complete day05-complete

# See what you accomplished in a specific day
git log day04-complete --oneline
```

### To Reset/Restart Current Work:

If you want to restart your current day's work:
```bash
# Reset to the last completed day (e.g., go back to day04-complete to restart day05)
git reset --hard day04-complete
```

## Benefits of This Simple Approach

1. **Clean Snapshots**: Each completed day is preserved
2. **Linear Progress**: Natural flow from one day to the next
3. **Easy Reset**: Can always go back to any completed day
4. **No Branch Confusion**: Only one branch per completed day
5. **Simple Navigation**: Easy to see your progress timeline

## Example Timeline

```
day01-complete → day02-complete → day03-complete → day04-complete → master (working on day05)
```

When day05 is complete, it becomes:
```
day01-complete → day02-complete → day03-complete → day04-complete → day05-complete → master (working on day06)
```
