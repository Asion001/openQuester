import 'dart:convert';

import 'package:mason_logger/mason_logger.dart';

import '../../getit.dart';
import '../common/file_command.dart';

class HashCommand extends FileCommand {
  HashCommand();

  @override
  String get description => 'Command for getting content file with hash';

  @override
  String get name => 'hash';

  @override
  Future<int> run() async {
    final siqFile = await getFile(hashFiles: true);
    getIt.get<Logger>().write(jsonEncode(siqFile.toJson()));

    return ExitCode.success.code;
  }
}
