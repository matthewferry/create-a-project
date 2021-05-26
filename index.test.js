import * as core from '@actions/core';
import * as github from '@actions/github';

describe('create-project', () => {
  let tools: Toolkit
  let params: any

  beforeEach(() => {
    nock('https://api.github.com')
      .post(/\/repos\/.*\/.*\/projects/).reply(200, (_, body) => {
        params = body
        return {
          title: body.title,
          number: 1,
          html_url: 'www'
        }
      })

    tools = generateToolkit()

    // Ensure that the filename input isn't set at the start of a test
    delete process.env.INPUT_FILENAME

    // Simulate an environment variable added for the action
    process.env.EXAMPLE = 'foo'
  })

  it('creates a new issue', async () => {
    await createAnIssue(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect((tools.log.success as any).mock.calls).toMatchSnapshot()

    // Verify that the outputs were set
    expect(core.setOutput).toHaveBeenCalledTimes(2)
    expect(core.setOutput).toHaveBeenCalledWith('url', 'www')
    expect(core.setOutput).toHaveBeenCalledWith('number', '1')
  })

  it('creates a new issue from a different template', async () => {
    process.env.INPUT_FILENAME = '.github/different-template.md'
    tools.context.payload = { repository: { owner: { login: 'JasonEtco' }, name: 'waddup' } }
    await createAnIssue(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect((tools.log.success as any).mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with some template variables', async () => {
    process.env.INPUT_FILENAME = '.github/variables.md'
    await createAnIssue(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect((tools.log.success as any).mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with assignees, labels and a milestone', async () => {
    process.env.INPUT_FILENAME = '.github/kitchen-sink.md'
    await createAnIssue(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect((tools.log.success as any).mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with assignees and labels as comma-delimited strings', async () => {
    process.env.INPUT_FILENAME = '.github/split-strings.md'
    await createAnIssue(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect((tools.log.success as any).mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with an assignee passed by input', async () => {
    process.env.INPUT_ASSIGNEES = 'octocat'
    await createAnIssue(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect((tools.log.success as any).mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with multiple assignees passed by input', async () => {
    process.env.INPUT_ASSIGNEES = 'octocat, JasonEtco'
    await createAnIssue(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.success).toHaveBeenCalled()
    expect((tools.log.success as any).mock.calls).toMatchSnapshot()
  })

  it('creates a new issue with a milestone passed by input', async () => {
    process.env.INPUT_MILESTONE = '1'
    await createAnIssue(tools)
    expect(params).toMatchSnapshot()
    expect(params.milestone).toBe(1)
    expect(tools.log.success).toHaveBeenCalled()
  })

  it('creates a new issue when updating existing issues is enabled but no issues with the same title exist', async () => {
    nock.cleanAll()
    nock('https://api.github.com')
      .get(/\/search\/issues.*/).reply(200, {
        items: []
      })
      .post(/\/repos\/.*\/.*\/issues/).reply(200, (_, body: any) => {
        params = body
        return {
          title: body.title,
          number: 1,
          html_url: 'www'
        }
      })

    process.env.INPUT_UPDATE_EXISTING = 'true'

    await createAnIssue(tools)
    expect(params).toMatchSnapshot()
    expect(tools.log.info).toHaveBeenCalledWith('No existing issue found to update')
    expect(tools.log.success).toHaveBeenCalled()
  })

  it('updates an existing issue with the same title', async () => {
    nock.cleanAll()
    nock('https://api.github.com')
      .get(/\/search\/issues.*/).reply(200, {
        items: [{ number: 1, title: 'Hello!' }]
      })
      .patch(/\/repos\/.*\/.*\/issues\/.*/).reply(200, {})
    process.env.INPUT_UPDATE_EXISTING = 'true'

    await createAnIssue(tools)
    expect(params).toMatchSnapshot()
    expect(tools.exit.success).toHaveBeenCalled()
  })

  it('exits when updating an issue fails', async () => {
    nock.cleanAll()
    nock('https://api.github.com')
      .get(/\/search\/issues.*/).reply(200, {
        items: [{ number: 1, title: 'Hello!' }]
      })
      .patch(/\/repos\/.*\/.*\/issues\/.*/).reply(500, {
        message: 'Updating issue failed'
      })

    await createAnIssue(tools)
    expect(tools.exit.failure).toHaveBeenCalled()
  })

  it('logs a helpful error if creating an issue throws an error', async () => {
    nock.cleanAll()
    nock('https://api.github.com')
      .post(/\/repos\/.*\/.*\/issues/).reply(500, {
        message: 'Validation error'
      })

    await createAnIssue(tools)
    expect(tools.log.error).toHaveBeenCalled()
    expect((tools.log.error as any).mock.calls).toMatchSnapshot()
    expect(tools.exit.failure).toHaveBeenCalled()
  })

  it('logs a helpful error if creating an issue throws an error with more errors', async () => {
    nock.cleanAll()
    nock('https://api.github.com')
      .post(/\/repos\/.*\/.*\/issues/).reply(500, {
        message: 'Validation error',
        errors: [{ foo: true }]
      })

    await createAnIssue(tools)
    expect(tools.log.error).toHaveBeenCalled()
    expect((tools.log.error as any).mock.calls).toMatchSnapshot()
    expect(tools.exit.failure).toHaveBeenCalled()
  })
})