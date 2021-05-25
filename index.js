const core = require('@actions/core');
const github = require('@actions/github');
const context = github.context;

// most @actions toolkit packages have async methods
async function run() {
  try {
    
    const githubToken = core.getInput('github-token');
    const octokit = github.getOctokit(githubToken);
    
    let columns = core.getInput('columns');
    
    const createProject = await octokit.rest.projects.createForRepo({
      owner: context.repo.owner,
      repo: context.repo.repo,
      name: core.getInput('name'),
    });
    
    console.log(columns.replace(/\r?\n/g, ", "));

    core.setOutput('project-id', createProject.data.id);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
