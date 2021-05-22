# Issue Volunteer Auto-Assignment

A GitHub action to allow auto-assignment of volunteers to issues. 

## Usage

Add the following contents to a file `.github/workflows/volunteers.yml`:

```
name: "Issue volunteer assignment"

on: [issue_comment]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: bhermann/issue-volunteer@v0.1.11
      with:
        GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}"
```

## Effects

If someone comments on an issue without an assignee with a comment including the phrase `I would like to work on this please!`, this issue will be assigned to the person making that comment. 

If the issue already has assignees, the comment is ignored and an additional comment is added to inform the volunteer. 