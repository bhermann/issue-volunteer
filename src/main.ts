import * as core from '@actions/core'
import * as github from '@actions/github'
import { context } from '@actions/github/lib/utils';
import { report } from 'process';

async function run(): Promise<void> {
  try {
    const token = core.getInput('GITHUB_TOKEN', { required: true })
    const assign_phrase = core.getInput('assign_phrase').toLowerCase();
    const completed_phrase = core.getInput('completed_phrase').toLowerCase();
    const completed_label = core.getInput('completed_label').toLowerCase();

    const octokit = github.getOctokit(token);
    type Octokit = typeof octokit;

    type IssueRef = { owner: string; repo: string; number: number; }


    core.info("Running issue volunteer action...");

    // Only work on issue comments.
    if (github.context.eventName !== "issue_comment") {
      core.setFailed("This is action is only valid on issue comments events.");
      return;
    }

    core.info("Working on issue comment...");

    const issueRef = context.issue;

    const comment_text = context.payload.comment!.body.toLowerCase();
    if (comment_text.includes(assign_phrase)) {
      await assignIssue(octokit, issueRef);
    } else if (comment_text.includes(completed_phrase)) {
      await completeIssue(token);
    } else {
      core.debug("Comment did not include any magic comment.");
    }

    async function assignIssue(octokit: Octokit, issueRef: IssueRef) {
      core.info("Found assignment phrase.");
      const issue = (await octokit.rest.issues.get({ owner: issueRef.owner, repo: issueRef.repo, issue_number: issueRef.number })).data;

      if (!issue.assignees || issue.assignees!.length == 0) {
        core.info("Issue can be assigned to the volunteer.");

        const volunteer = context.payload.sender!['login'];

        octokit.rest.issues.addAssignees({
          owner: issueRef.owner,
          repo: issueRef.repo,
          issue_number: issueRef.number,
          assignees: [volunteer]
        });

        octokit.rest.issues.createComment({
          owner: issueRef.owner,
          repo: issueRef.repo,
          issue_number: issueRef.number,
          body: "Great! I assigned you (@" + volunteer + ") to the issue. Have fun working on it!"
        });

      } else {
        core.info("Issue already has an assignee.");

        octokit.rest.issues.createComment({
          owner: issueRef.owner,
          repo: issueRef.repo,
          issue_number: issueRef.number,
          body: "Sorry, can't help you here. This issue already has a volunteer."
        });
      }
    }

    async function completeIssue(token: string) {
      core.info("Found phrase for completed work.");
      const issue = (await octokit.rest.issues.get({ owner: issueRef.owner, repo: issueRef.repo, issue_number: issueRef.number })).data;

      const reporter = context.payload.sender!['login'];

      if (issue.assignees?.find(a => a?.login == reporter)) {

        octokit.rest.issues.removeAssignees({
          owner: issueRef.owner,
          repo: issueRef.repo,
          issue_number: issueRef.number,
          assignees: [reporter]
        });

        octokit.rest.issues.removeAllLabels({
          owner: issueRef.owner,
          repo: issueRef.repo,
          issue_number: issueRef.number});

        octokit.rest.issues.addLabels({
          owner: issueRef.owner,
          repo: issueRef.repo,
          issue_number: issueRef.number,
          labels: [completed_label]
        });

        octokit.rest.issues.createComment({
          owner: issueRef.owner,
          repo: issueRef.repo,
          issue_number: issueRef.number,
          body: "Thank you @" + reporter + "! We have pushed the issue along in the workflow."
        });

      } else {
        core.info("Completion requested for issue where the requestor was not assigned.");

        octokit.rest.issues.createComment({
          owner: issueRef.owner,
          repo: issueRef.repo,
          issue_number: issueRef.number,
          body: "Sorry, can't help you here. You are not the volunteer for this issue."
        });
      }

    }

  } catch (error) {
    core.setFailed(error.message)
  }

}

run()
