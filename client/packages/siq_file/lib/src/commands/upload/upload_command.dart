import 'package:mason_logger/mason_logger.dart';
import 'package:siq_file/src/getit.dart';

import '../common/file_command.dart';

class UploadCommand extends FileCommand {
  UploadCommand();

  @override
  String get description => 'Command for uploading packs';

  @override
  String get name => 'upload';

  @override
  Future<int> run() async {
    final siqFile = await getFile(hashFiles: true);
    getIt.get<Logger>().prompt('Login');

    return ExitCode.success.code;
  }
}
