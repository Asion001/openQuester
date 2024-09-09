import 'dart:convert';

import 'package:mason_logger/mason_logger.dart';

import '../../getit.dart';
import '../common/file_command.dart';

class JsonCommand extends FileCommand {
  JsonCommand() {
    argParser.addOption(
      'xml-file',
      help: 'Unziped content.xml file path',
    );
  }

  @override
  String get description =>
      'Command for exporting content file from siq file to json format';

  @override
  String get name => 'json';

  @override
  Future<int> run() async {
    final siqFile = await getFile(xmlFilePath: argResults?.option('xml-file'));
    getIt.get<Logger>().write(jsonEncode(siqFile.toJson()));

    return ExitCode.success.code;
  }
}
