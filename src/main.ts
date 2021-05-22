import * as core from '@actions/core'
import * as github from '@actions/github'
import { context } from '@actions/github/lib/utils';

async function run(): Promise<void> {
  try {
    core.info("Running issue volunteer action...");

    // Only work on issue comments.
    if (github.context.eventName !== "issue_comment")  {
      core.setFailed("This is action is only valid on issue comments events.");
      return;
    }

    core.info("Working on issue comment...");

    // Check for volunteer message 
    if (context.payload.comment!.body.toLowerCase().includes("I would like to work on this please!")) {
      core.info("Found volunteer message.");
      core.info(JSON.stringify(context.issue));
    } else {
      core.info("Did not find volunteer message. Comment was:")
      core.info(context.payload.comment!.body);
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
