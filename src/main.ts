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

    const octokit = github.getOctokit(token);
  
    core.info("Working on issue comment...");
    core.info("Issue was:");

    const issueRef = context.issue;
    core.info(JSON.stringify(issueRef));
    
    const issue = await octokit.rest.issues.get({owner: issueRef.owner, repo: issueRef.repo , issue_number: issueRef.number });

    core.info(issue.data.title);
    core.info(JSON.stringify(issue));

    // Check for volunteer message 
    if (context.payload.comment!.body.toLowerCase().includes("i would like to work on this please!")) {
      core.info("Found volunteer message.");

    } else {
      core.info("Did not find volunteer message. Comment was:");
      core.info(context.payload.comment!.body.toLowerCase());
      core.info(context.payload.comment!.body.toLowerCase().includes("i would like"));
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
