import 'package:freezed_annotation/freezed_annotation.dart';

import '../siq_file/file_object.dart';

class ImageFileConverter implements JsonConverter<FileObject, String> {
  const ImageFileConverter();

  @override
  FileObject fromJson(String value) {
    return FileObject(path: value, type: FileType.image);
  }

  @override
  String toJson(FileObject object) => object.path ?? object.sha256!;
}
