import * as core from '@actions/core'
import * as github from '@actions/github'
import { context } from '@actions/github/lib/utils';
import {wait} from './wait'

async function run(): Promise<void> {
  try {

    // Only work on issue comments.
    if (github.context.eventName != "issue_comment")  {
      core.error("This is action is only valid on issue comments events.");
      return;
    }

    // Check for volunteer message 
    if (context.payload.comment!.body.toLowerCase().includes("I would like to work on this please!")) {
      core.debug("Found volunteer message.");
      
    }

    const ms: string = core.getInput('milliseconds')
    core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true

    core.debug(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

    
    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
