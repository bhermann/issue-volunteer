import * as core from '@actions/core'
import * as github from '@actions/github'
import { context } from '@actions/github/lib/utils';

async function run(): Promise<void> {
  try {

    // Only work on issue comments.
    if (github.context.eventName !== "issue_comment")  {
      core.setFailed("This is action is only valid on issue comments events.");
      return;
    }

    // Check for volunteer message 
    if (context.payload.comment!.body.toLowerCase().includes("I would like to work on this please!")) {
      core.info("Found volunteer message.");
      core.info(JSON.stringify(context.issue));
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
