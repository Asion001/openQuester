import 'package:mason_logger/mason_logger.dart';
import 'package:siq_file/src/getit.dart';
import 'package:universal_io/io.dart';
import 'package:args/command_runner.dart';
import '../../parser/content_xml_parser.dart';
import '../../parser/siq_archive_parser.dart';
import '../../siq_file/siq_file.dart';

abstract class FileCommand extends Command<int> {
  Future<SiqFile> getFile({
    String? xmlFilePath,
    bool hashFiles = false,
  }) async {
    final importProgress = getIt.get<Logger>().progress('Importing');

    SiqFile? siqFile;
    if (xmlFilePath == null) {
      siqFile = await _getFromArchive(hashFiles);
    } else {
      siqFile = _getFromXmlFile(xmlFilePath);
    }
    importProgress.complete('Imported file ${siqFile.metadata.title}');

    return siqFile;
  }

  SiqFile _getFromXmlFile(String xmlFilePath) {
    final xmlFile = File(xmlFilePath);
    final contentFile = xmlFile.readAsStringSync();
    final contentXml = ContentXmlParser(contentFile);
    return contentXml.siqFile;
  }

  Future<SiqFile> _getFromArchive(bool hashFiles) async {
    if (argResults!.rest.isEmpty) {
      usageException('Provide file path');
    }
    if (argResults!.rest.length > 1) {
      usageException('Too many arguments');
    }

    final target = argResults!.rest[0];
    final targetFile = File(target);
    final targetStream = FileStream(
        stream: targetFile.openRead(), fileLength: await targetFile.length());
    final siqArchive = SiqArchiveParser(targetStream);
    final siqFile = await siqArchive.parse(hashFiles: hashFiles);

    return siqFile;
  }
}
