// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'file_object.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$FileObjectImpl _$$FileObjectImplFromJson(Map<String, dynamic> json) =>
    _$FileObjectImpl(
      type: $enumDecode(_$FileTypeEnumMap, json['type']),
      path: json['path'] as String?,
      sha256: json['sha256'] as String?,
    );

Map<String, dynamic> _$$FileObjectImplToJson(_$FileObjectImpl instance) {
  final val = <String, dynamic>{
    'type': _$FileTypeEnumMap[instance.type]!,
  };

  void writeNotNull(String key, dynamic value) {
    if (value != null) {
      val[key] = value;
    }
  }

  writeNotNull('path', instance.path);
  writeNotNull('sha256', instance.sha256);
  return val;
}

const _$FileTypeEnumMap = {
  FileType.image: 'image',
  FileType.video: 'video',
  FileType.audio: 'audio',
};
