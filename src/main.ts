import * as core from '@actions/core'
import * as github from '@actions/github'
import { context, getOctokitOptions } from '@actions/github/lib/utils';
import { hasUncaughtExceptionCaptureCallback, report } from 'process';

async function run(): Promise<void> {
  try {
    const token = core.getInput('GITHUB_TOKEN', { required: true })

    const phrases = {
      assign : core.getInput('assign_phrase').toLowerCase(),
      completion : core.getInput('completed_phrase').toLowerCase(),
      phase1Results : core.getInput('phase1_results_phrase').toLowerCase(),
      phase2Results : core.getInput('phase2_results_phrase').toLowerCase(),
      unroll : core.getInput('unroll_phrase').toLowerCase()
    }

    const labels = {
      phase1 : core.getInput('label_phase1'),
      phase2 : core.getInput('label_phase2'),
      phase3 : core.getInput('label_phase3')
    }

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
    if (comment_text.includes(phrases.assign)) {
      await assignIssue(octokit, issueRef);
    } else if (comment_text.includes(phrases.completion)) {
      await completeIssue(token);
    } else if (comment_text.includes(phrases.phase1Results)) {
      await processResults(token, phrases.phase1Results);
    } else if (comment_text.includes(phrases.phase2Results)) {
      await processResults(token, phrases.phase2Results);
    } else if (comment_text.includes(phrases.unroll)) {
      await unroll(token);
    } else {
      core.debug("Comment did not include any magic comment.");
    }

    async function assignIssue(octokit: Octokit, issueRef: IssueRef) {
      core.info("Found assignment phrase.");
      const issue = (await octokit.rest.issues.get({ owner: issueRef.owner, repo: issueRef.repo, issue_number: issueRef.number })).data;

      if (!issue.assignees || issue.assignees!.length == 0) {
        core.info("Issue can be assigned to the volunteer.");

        const volunteer = context.payload.sender!['login'];

        issue.labels.forEach(l => core.info(JSON.stringify(l)));
        
        if (issue.labels.find(l => l == labels.phase1 || l == labels.phase2) != null) {
          
          // TODO: Check that phase1 and phase2 assignees are different

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
        }
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

        if (issue.labels.find(l => l == labels.phase1 || l == labels.phase2) != null) {

          var currentLabel : string = "";
          var nextLabel : string = "";

          if (issue.labels.find(l => l == labels.phase1)) {
            currentLabel = labels.phase1;
            nextLabel = labels.phase2;
          } else if (issue.labels.find(l => l == labels.phase2)) { 
            currentLabel = labels.phase2;
            nextLabel = labels.phase3;
          }

          octokit.rest.issues.removeAssignees({
            owner: issueRef.owner,
            repo: issueRef.repo,
            issue_number: issueRef.number,
            assignees: [reporter]
          });

          octokit.rest.issues.removeLabel({
            owner: issueRef.owner,
            repo: issueRef.repo,
            issue_number: issueRef.number,
            name: currentLabel});

          octokit.rest.issues.addLabels({
            owner: issueRef.owner,
            repo: issueRef.repo,
            issue_number: issueRef.number,
            labels: [nextLabel]
          });

          octokit.rest.issues.createComment({
            owner: issueRef.owner,
            repo: issueRef.repo,
            issue_number: issueRef.number,
            body: "Thank you @" + reporter + "! We have pushed the issue along in the workflow."
          });
        }
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

  function processResults(token: string, resultPhrase: string) {
    core.info("Found phrase for results.");
  }
  
  function unroll(token: string) {
    core.info("Found phrase to unroll.");
  }
}

run()


