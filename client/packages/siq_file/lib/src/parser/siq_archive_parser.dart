import 'dart:convert';
import 'dart:typed_data';

import 'package:archive/archive_io.dart';
import 'package:collection/collection.dart';
import 'package:mason_logger/mason_logger.dart';
import 'package:siq_file/src/getit.dart';

import '../siq_file/siq_file.dart';
import 'content_xml_parser.dart';

class SiqArchiveParser {
  SiqArchiveParser(this._file);

  final FileStream _file;
  SiqFile? _siqFile;
  SiqFile get file => _siqFile!;

  InputFileStream? targetStream;
  RamFileData? inputRamFileData;
  Archive? archive;

  Future<SiqFile> parse({bool hashFiles = false}) async {
    await _unzip();

    final parseProgress = getIt.get<Logger>().progress('Parsing file');
    _getContentFile(archive!);
    parseProgress.complete();

    if (hashFiles) {
      final hashProgress = getIt.get<Logger>().progress('Generating file hash');
      _hashFiles(archive!);
      hashProgress.complete();
    }
    close();

    return _siqFile!;
  }

  void close() {
    targetStream?.closeSync();
    inputRamFileData?.clear();
    archive?.clearSync();
  }

  Future<void> _unzip() async {
    if (archive != null) return;

    final progress = getIt.get<Logger>().progress('Unziping archive');
    inputRamFileData = await RamFileData.fromStream(
        _file.stream.map(Uint8List.fromList), _file.fileLength);
    targetStream = InputFileStream.withFileBuffer(
        FileBuffer(RamFileHandle.fromRamFileData(inputRamFileData!)));
    archive = ZipDecoder().decodeBuffer(
      targetStream!,
      verify: false, //TODO: add option to verify
    );
    progress.complete();
  }

  void _getContentFile(Archive archive) {
    for (var file in archive.files) {
      if (!file.isFile) continue;
      if (file.name == 'content.xml') {
        _parseContentFile(file);
        break;
      }
    }
  }

  void _hashFiles(Archive archive) {
    if (_siqFile == null) return;
    _siqFile = _siqFile?.copyWithFiles((file) {
      if (file == null) return file;

      final archiveFile =
          archive.firstWhereOrNull((e) => e.name == file.file.fullPath);
      if (archiveFile == null) return file;

      //TODO: make this more memory efficient
      final content = archiveFile.content;
      final fileWithHash = file.file.copyWithHash(content).copyWith(path: null);

      return file.copyWith(file: fileWithHash);
    });
  }

  void _parseContentFile(ArchiveFile file) {
    final output = OutputStream();
    file.writeContent(output);

    final contentFile = utf8.decode(output.getBytes());
    output.clear();

    final contentXml = ContentXmlParser(contentFile);

    _siqFile = contentXml.siqFile;
  }
}

class FileStream {
  const FileStream({
    required this.fileLength,
    required this.stream,
  });
  final int fileLength;
  final Stream<List<int>> stream;
}
