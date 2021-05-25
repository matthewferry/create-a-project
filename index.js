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

    const parseColumns = (c) => {
      c.split(/\r?\n/).reduce((acc, line) => {
        acc
          .concat(line.split(","))
          .filter(pat => pat)
          .map(pat => pat.trim())
      }, []);
    };
    
    // columns.split(/\r?\n/);

    console.log(parseColumns(columns));

    parseColumns(columns).forEach((column) => {
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
