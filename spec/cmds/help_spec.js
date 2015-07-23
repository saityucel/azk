import h from 'spec/spec_helper';
import { Cli } from 'azk/cli';

describe('Azk cli, help controller', function() {
  var outputs = [];
  var ui = h.mockUI(beforeEach, outputs);

  var cli_options = {};
  var cli = new Cli(cli_options)
    .route('help', (p) => p.help || p['--help'])
    .route('agent');

  var doc_opts    = { exit: false };
  var run_options = { ui: ui };

  it("should run help command", function() {
    doc_opts.argv = 'help';
    var options = cli.docopt(doc_opts);
    return cli.run(doc_opts, run_options).then((code) => {
      h.expect(code).to.eql(0);
      h.expect(options).to.have.property('help', true);
      h.expect(outputs[0]).to.match(RegExp('Usage:', 'gi'));
    });
  });

  it("should run --help command", function() {
    doc_opts.argv = ['--help'];
    return cli.run(doc_opts, run_options).then((code) => {
      h.expect(code).to.eql(0);
      h.expect(outputs[0]).to.match(RegExp('Usage:', 'gi'));
    });
  });

  it("should run -h command", function() {
    doc_opts.argv = '-h';
    return cli.run(doc_opts, run_options).then((code) => {
      h.expect(code).to.eql(0);
      h.expect(outputs[0]).to.match(RegExp('Usage:'    , 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Commands:' , 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Actions:'  , 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Arguments:', 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Options:'  , 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Examples:' , 'gi'));
    });
  });

  it("should run `agent --help` command", function() {
    doc_opts.argv = ['agent', '--help'];
    return cli.run(doc_opts, run_options).then((code) => {
      h.expect(code).to.eql(0);
      h.expect(outputs[0]).to.match(RegExp('Usage:'    , 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Actions:'  , 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Options:'  , 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Examples:' , 'gi'));
    });
  });

  it("should run `help agent` command", function() {
    doc_opts.argv = ['help', 'agent'];
    return cli.run(doc_opts, run_options).then((code) => {
      h.expect(code).to.eql(0);
      h.expect(outputs[0]).to.match(RegExp('Usage:'    , 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Actions:'  , 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Options:'  , 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Examples:' , 'gi'));
    });
  });

  it("should run `start --help` command", function() {
    doc_opts.argv = ['start', '--help'];
    return cli.run(doc_opts, run_options).then((code) => {
      h.expect(code).to.eql(0);
      h.expect(outputs[0]).to.match(RegExp('Usage:'    , 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Arguments:', 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Options:'  , 'gi'));
    });
  });

  it("should run `help start` command", function() {
    doc_opts.argv = ['help', 'start'];
    return cli.run(doc_opts, run_options).then((code) => {
      h.expect(code).to.eql(0);
      h.expect(outputs[0]).to.match(RegExp('Usage:'    , 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Arguments:', 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Options:'  , 'gi'));
    });
  });

  it("should run `vm --help` command", function() {
    doc_opts.argv = ['vm', '--help'];
    return cli.run(doc_opts, run_options).then((code) => {
      h.expect(code).to.eql(0);
      h.expect(outputs[0]).to.match(RegExp('Usage:'    , 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Actions:'  , 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Arguments:', 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Options:'  , 'gi'));
    });
  });

  it("should run `start --help` command to not duplicated itens", function() {

    function getRegexMatches (content, regex) {
      var match, matches = [];

      while ((match = regex.exec(content)) !== null) {
        if (match.index === regex.lastIndex) {
          regex.lastIndex++;
        }
        matches.push(match);
      }
      return matches;
    }

    doc_opts.argv = ['start', '--help'];
    return cli.run(doc_opts, run_options).then((code) => {
      h.expect(code).to.eql(0);
      h.expect(outputs[0]).to.match(RegExp('Usage:'    , 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Actions:'  , 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Arguments:', 'gi'));
      h.expect(outputs[0]).to.match(RegExp('Options:'  , 'gi'));
      // must show only one log option
      var matches = getRegexMatches(outputs[0], /<level>, -l/g);
      h.expect(matches).to.have.length(1);
    });
  });
});
