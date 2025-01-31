// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, unused_import

import 'package:freezed_annotation/freezed_annotation.dart';

import 'page_info2.dart';
import 'response_user.dart';

part 'paginated_users.freezed.dart';
part 'paginated_users.g.dart';

@Freezed()
class PaginatedUsers with _$PaginatedUsers {
  const factory PaginatedUsers({
    required List<ResponseUser> data,
    required PageInfo2 pageInfo,
  }) = _PaginatedUsers;
  
  factory PaginatedUsers.fromJson(Map<String, Object?> json) => _$PaginatedUsersFromJson(json);
}
