// dart format width=80
// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// Generator: WorkerGenerator 6.2.0
// **************************************************************************

import 'package:squadron/squadron.dart';

import 'upload_isolate.dart';

void _start$ParseSiqFile(WorkerRequest command) {
  /// VM entry point for ParseSiqFile
  run($ParseSiqFileInitializer, command);
}

EntryPoint $getParseSiqFileActivator(SquadronPlatformType platform) {
  if (platform.isVm) {
    return _start$ParseSiqFile;
  } else {
    throw UnsupportedError('${platform.label} not supported.');
  }
}
