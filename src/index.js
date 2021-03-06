const core = require('@actions/core');
const github = require('@actions/github');
const context = github.context;

// most @actions toolkit packages have async methods
async function run() {
  try {
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
    const columns = core.getInput('columns').split(/(?:\r?\n+)|(?:,\s)/);
    
    const createProject = await octokit.rest.projects.createForRepo({
      owner: context.repo.owner,
      repo: context.repo.repo,
      name: core.getInput('name'),
      body: core.getInput('description') || null,
      private: core.getInput('private'),
    });

    columns.forEach((column) => {
      octokit.rest.projects.createColumn({
        project_id: createProject.data.id,
        name: column,
      });
    });

    core.setOutput('project-id', createProject.data.id);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
