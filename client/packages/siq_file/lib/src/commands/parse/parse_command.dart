import 'package:mason_logger/mason_logger.dart';
import 'package:siq_file/src/getit.dart';

import '../common/file_command.dart';

class ParseCommand extends FileCommand {
  ParseCommand();

  @override
  String get description => 'Command for parsing siq file.';

  @override
  String get name => 'parse';

  @override
  Future<int> run() async {
    final siqFile = await getFile();
    getIt.get<Logger>().success('Package title: ${siqFile.metadata.title}');

    return ExitCode.success.code;
  }
}
