import 'package:args/command_runner.dart';
import 'package:cli_completion/cli_completion.dart';
import 'package:mason_logger/mason_logger.dart';
import 'package:args/args.dart';

import 'commands/commands.dart';
import 'getit.dart';
import 'version.dart';

class SiqFileCommandRunner extends CompletionCommandRunner<int> {
  SiqFileCommandRunner({
    Logger? logger,
    Map<String, String>? environment,
  })  : _logger = logger ?? Logger(),
        super('siq_file', '🦄 A sigame file parser') {
    argParser
      ..addFlag('version', help: 'Print the current version.', abbr: 'v')
      ..addFlag(
        'verbose',
        help: 'Noisy logging, including all shell commands executed.',
        abbr: 'V',
      );

    getIt.registerSingleton<Logger>(_logger);

    addCommand(ParseCommand());
    addCommand(JsonCommand());
    addCommand(HashCommand());
    addCommand(UploadCommand());
  }

  final Logger _logger;

  @override
  void printUsage() => _logger.info(usage);

  @override
  bool get enableAutoInstall => false;

  @override
  Future<int> run(Iterable<String> args) async {
    try {
      final argResults = parse(args);

      if (argResults['verbose'] == true) {
        _logger.level = Level.verbose;
      }
      return await runCommand(argResults) ?? ExitCode.success.code;
    } on FormatException catch (e, stackTrace) {
      _logger
        ..err(e.message)
        ..err('$stackTrace')
        ..info('')
        ..info(usage);
      return ExitCode.usage.code;
    } on UsageException catch (e) {
      _logger
        ..err(e.message)
        ..info('')
        ..info(e.usage);
      return ExitCode.usage.code;
    }
  }

  @override
  Future<int?> runCommand(ArgResults topLevelResults) async {
    if (topLevelResults.command?.name == 'completion') {
      await super.runCommand(topLevelResults);
      return ExitCode.success.code;
    }

    _logger
      ..detail('Argument information:')
      ..detail('  Top level options:');
    for (final option in topLevelResults.options) {
      if (topLevelResults.wasParsed(option)) {
        _logger.detail('  - $option: ${topLevelResults[option]}');
      }
    }
    if (topLevelResults.command != null) {
      final commandResult = topLevelResults.command!;
      _logger
        ..detail('  Command: ${commandResult.name}')
        ..detail('    Command options:');
      for (final option in commandResult.options) {
        if (commandResult.wasParsed(option)) {
          _logger.detail('    - $option: ${commandResult[option]}');
        }
      }

      if (commandResult.command != null) {
        final subCommandResult = commandResult.command!;
        _logger.detail('    Command sub command: ${subCommandResult.name}');
      }
    }

    int? exitCode = ExitCode.unavailable.code;
    if (topLevelResults['version'] == true) {
      _logger.info(packageVersion);
      exitCode = ExitCode.success.code;
    } else {
      exitCode = await super.runCommand(topLevelResults);
    }

    return exitCode;
  }
}
