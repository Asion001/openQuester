// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'oq_content_structure.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$OQContentStructureImpl _$$OQContentStructureImplFromJson(
        Map<String, dynamic> json) =>
    _$OQContentStructureImpl(
      metadata: OQMetadataStructure.fromJson(
          json['metadata'] as Map<String, dynamic>),
      rounds: (json['rounds'] as List<dynamic>)
          .map((e) => OQRoundStructure.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$$OQContentStructureImplToJson(
        _$OQContentStructureImpl instance) =>
    <String, dynamic>{
      'metadata': instance.metadata,
      'rounds': instance.rounds,
    };
