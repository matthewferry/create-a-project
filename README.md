# Create a project action

## Usage

This GitHub Action creates a new project. Here's an example workflow that creates a project every week.

```yaml
# .github/workflows/create-sprint.yml
on:
  schedule:
    - cron: 0 9 * * 1
name: Create sprint project board
jobs:
  create-project:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: echo "WEEK=$(date '+%B %d, %Y')" >> $GITHUB_ENV
      - uses: matthewferry/create-a-project@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          name: "Sprint: ${{ env.WEEK }}"
          description: Weekly sprint planning project
          columns: |
            📨 Backlog
            🧑‍💻 In progress
            ✅ Done
            🚢 Shipped
```
