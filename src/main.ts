import * as core from '@actions/core'
import * as github from '@actions/github'
import { context } from '@actions/github/lib/utils';

async function run(): Promise<void> {
  try {
    const token = core.getInput('GITHUB_TOKEN', { required: true })

    core.info("Running issue volunteer action...");

    // Only work on issue comments.
    if (github.context.eventName !== "issue_comment")  {
      core.setFailed("This is action is only valid on issue comments events.");
      return;
    }

    core.info("Working on issue comment...");

    // Check for volunteer message 
    if (context.payload.comment!.body.toLowerCase().includes("i would like to work on this please!")) {
      core.info("Found volunteer message.");

      const octokit = github.getOctokit(token);
      const issueRef = context.issue;
      core.info(JSON.stringify(issueRef));
      const issueResponse = await octokit.rest.issues.get({owner: issueRef.owner, repo: issueRef.repo , issue_number: issueRef.number });
      const issue = issueResponse.data;

      if (!issue.assignees || issue.assignees!.length == 0) {
        core.info("Issue can be assigned to the volunteer.");

        const volunteer = "bhermann";

        octokit.rest.issues.addAssignees({
          owner: issueRef.owner, 
          repo: issueRef.repo , 
          issue_number: issueRef.number,
          assignees: [ volunteer ]
        })

      } else {
        core.info("Issue already has an assignee.");

        octokit.rest.issues.createComment({
          owner: issueRef.owner, 
          repo: issueRef.repo , 
          issue_number: issueRef.number,
          body: "Issue already has a volunteer."});
      }

    } else {
      core.info("Did not find volunteer message.");
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
