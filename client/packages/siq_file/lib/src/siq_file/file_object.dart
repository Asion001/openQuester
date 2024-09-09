import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:crypto/crypto.dart' as crypto;

part 'file_object.freezed.dart';
part 'file_object.g.dart';

enum FileType { image, video, audio }

@freezed
class FileObject with _$FileObject {
  const factory FileObject({
    required FileType type,
    String? path,
    String? sha256,
  }) = _FileObject;

  factory FileObject.fromJson(Map<String, dynamic> json) =>
      _$FileObjectFromJson(json);

  const FileObject._();

  FileObject copyWithHash(List<int> rawFile) {
    digest() => crypto.sha256.convert(rawFile);
    final sha256 = this.sha256 ?? digest().toString();

    return copyWith(sha256: sha256);
  }

  String get fullPath => '${fileTypeToFolder[type]}/${path ?? sha256}';
}

Map<FileType, String> fileTypeToFolder = {
  FileType.audio: 'Audio',
  FileType.video: 'Video',
  FileType.image: 'Images',
};
