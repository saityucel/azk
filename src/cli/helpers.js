import { _, log, lazy_require, config, t } from 'azk';
import { ManifestError } from 'azk/utils/errors';

var lazy = lazy_require({
  AgentClient: ['azk/agent/client', 'Client'],
  Configure  : ['azk/agent/configure', 'Configure'],
});

var Helpers = {
  requireAgent(cli) {
    return lazy.AgentClient
      .status()
      .then((status) => {
        if (!status.agent && cli.isInteractive()) {
          var question = {
            type    : 'confirm',
            name    : 'start',
            message : 'commands.agent.start_before',
            default : true
          };

          return cli.prompt(question)
            .then((answers) => {
              var cmd = "azk agent start";
              return answers.start ? cli.execSh(cmd) : false;
            });
        }
      })
      .then(() => {
        return lazy.AgentClient.require();
      });
  },

  configure(cli) {
    cli.ok('configure.loading_checking');
    return (new lazy.Configure(cli))
      .run()
      .then((configs) => {
        cli.ok('configure.loaded');
        return configs;
      });
  },

  manifestValidate(ui, manifest) {
    var validation_errors = manifest.validate();
    if (validation_errors.length === 0) { return; }

    // has deprecate errors?
    if (!config('flags:hide_deprecate')) {
      var deprecate_val_errors = _.filter(validation_errors, function (item) {
        return item.level === 'deprecate';
      });
      if (deprecate_val_errors.length > 0) {
        ui.output("");
        ui.deprecate("manifest.validate.deprecated_title");
        _.each(deprecate_val_errors, (deprecate_val_error) => {
          ui.deprecate(`manifest.validate.${deprecate_val_error.key}`, deprecate_val_error);
        });
        ui.output("");
      }
    }

    // has fails level errors?
    var val_errors = _.filter(validation_errors, function (item) {
      return item.level === 'fail';
    });

    _.each(val_errors, (val_error) => {
      var msg = t(`manifest.validate.${val_error.key}`, val_error);
      throw new ManifestError(this.file, msg);
    });
  },

  vmStartProgress(cmd) {
    return (event) => {
      if (!event) {
        return;
      }

      var tKey    = null;
      var context = event.context || "agent";
      var keys    = ["status", context];

      switch (event.type) {
        case "status":
          // running, starting, not_running, already_installed
          switch (event.status) {
            case "not_running":
            case "already_installed":
            case "down":
              cmd.fail([...keys].concat(event.status), event.data);
              break;
            case "error":
              if (event.data instanceof Error) {
                cmd.fail(event.data.toString());
              } else {
                cmd.fail([...keys].concat(event.status), event);
              }
              break;
            default:
              if (event.keys) {
                cmd[event.status || "ok"](event.keys, event.data);
              } else {
                cmd.ok([...keys].concat(event.status), event.data);
              }
          }
          break;
        case "wait_port":
          tKey = ["status", event.system, "wait"];
          log.info_t(tKey, event);
          cmd.ok(tKey, event);
          break;
        case "try_connect":
          if (context === "balancer") {
            tKey = [...keys].concat("progress");
            log.info_t(tKey, event);
            cmd.ok(tKey, event);
          }
          break;
        case "ssh":
          if (context === "stderr") {
            break;
          } else {
            log.debug({ log_label: "[vm_progress] [ssh]", data: event});
          }
          break;
        default:
          log.debug({ log_label: "[vm_progress]", data: event});
      }
    };
  },

  escapeCapture(callback) {
    // Escape sequence
    var escapeBuffer = false;
    var escape = false;

    return (event) => {
      if (event.type == "stdin_pipe") {
        var stdin  = event.data[0].stdin;
        var stream = event.data[0].stream;
        var container = event.id;
        var stopped = false;

        stdin.on('data', function (key) {
          if (stopped) {
            return false;
          }

          var ch = key.toString(stdin.encoding || 'utf-8');

          if (escapeBuffer && ch === '~') {
            escapeBuffer = false;
            escape = true;
          } else if (ch === '\r') {
            escapeBuffer = true;
            stream.write(key);
          } else {
            if (escape) {
              stopped = callback(ch, container, () => stopped = false);
              escape = false;
            } else {
              stream.write(key);
            }
            escapeBuffer = false;
          }
        });
      }
      return true;
    };
  }
};

export { Helpers };
