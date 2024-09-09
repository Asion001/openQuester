// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'file_object.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

FileObject _$FileObjectFromJson(Map<String, dynamic> json) {
  return _FileObject.fromJson(json);
}

/// @nodoc
mixin _$FileObject {
  FileType get type => throw _privateConstructorUsedError;
  String? get path => throw _privateConstructorUsedError;
  String? get sha256 => throw _privateConstructorUsedError;

  /// Serializes this FileObject to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of FileObject
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $FileObjectCopyWith<FileObject> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $FileObjectCopyWith<$Res> {
  factory $FileObjectCopyWith(
          FileObject value, $Res Function(FileObject) then) =
      _$FileObjectCopyWithImpl<$Res, FileObject>;
  @useResult
  $Res call({FileType type, String? path, String? sha256});
}

/// @nodoc
class _$FileObjectCopyWithImpl<$Res, $Val extends FileObject>
    implements $FileObjectCopyWith<$Res> {
  _$FileObjectCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of FileObject
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? type = null,
    Object? path = freezed,
    Object? sha256 = freezed,
  }) {
    return _then(_value.copyWith(
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as FileType,
      path: freezed == path
          ? _value.path
          : path // ignore: cast_nullable_to_non_nullable
              as String?,
      sha256: freezed == sha256
          ? _value.sha256
          : sha256 // ignore: cast_nullable_to_non_nullable
              as String?,
    ) as $Val);
  }
}

/// @nodoc
abstract class _$$FileObjectImplCopyWith<$Res>
    implements $FileObjectCopyWith<$Res> {
  factory _$$FileObjectImplCopyWith(
          _$FileObjectImpl value, $Res Function(_$FileObjectImpl) then) =
      __$$FileObjectImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call({FileType type, String? path, String? sha256});
}

/// @nodoc
class __$$FileObjectImplCopyWithImpl<$Res>
    extends _$FileObjectCopyWithImpl<$Res, _$FileObjectImpl>
    implements _$$FileObjectImplCopyWith<$Res> {
  __$$FileObjectImplCopyWithImpl(
      _$FileObjectImpl _value, $Res Function(_$FileObjectImpl) _then)
      : super(_value, _then);

  /// Create a copy of FileObject
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? type = null,
    Object? path = freezed,
    Object? sha256 = freezed,
  }) {
    return _then(_$FileObjectImpl(
      type: null == type
          ? _value.type
          : type // ignore: cast_nullable_to_non_nullable
              as FileType,
      path: freezed == path
          ? _value.path
          : path // ignore: cast_nullable_to_non_nullable
              as String?,
      sha256: freezed == sha256
          ? _value.sha256
          : sha256 // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$FileObjectImpl extends _FileObject {
  const _$FileObjectImpl({required this.type, this.path, this.sha256})
      : super._();

  factory _$FileObjectImpl.fromJson(Map<String, dynamic> json) =>
      _$$FileObjectImplFromJson(json);

  @override
  final FileType type;
  @override
  final String? path;
  @override
  final String? sha256;

  @override
  String toString() {
    return 'FileObject(type: $type, path: $path, sha256: $sha256)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$FileObjectImpl &&
            (identical(other.type, type) || other.type == type) &&
            (identical(other.path, path) || other.path == path) &&
            (identical(other.sha256, sha256) || other.sha256 == sha256));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hash(runtimeType, type, path, sha256);

  /// Create a copy of FileObject
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$FileObjectImplCopyWith<_$FileObjectImpl> get copyWith =>
      __$$FileObjectImplCopyWithImpl<_$FileObjectImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$FileObjectImplToJson(
      this,
    );
  }
}

abstract class _FileObject extends FileObject {
  const factory _FileObject(
      {required final FileType type,
      final String? path,
      final String? sha256}) = _$FileObjectImpl;
  const _FileObject._() : super._();

  factory _FileObject.fromJson(Map<String, dynamic> json) =
      _$FileObjectImpl.fromJson;

  @override
  FileType get type;
  @override
  String? get path;
  @override
  String? get sha256;

  /// Create a copy of FileObject
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$FileObjectImplCopyWith<_$FileObjectImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
