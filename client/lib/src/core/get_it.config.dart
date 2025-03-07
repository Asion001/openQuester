// dart format width=80
// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// InjectableConfigGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'package:get_it/get_it.dart' as _i174;
import 'package:injectable/injectable.dart' as _i526;

import '../connection/api/api.dart' as _i149;
import '../connection/auth/oauth2_controller.dart' as _i419;
import '../connection/controllers/auth_controller.dart' as _i785;
import '../connection/controllers/dio_controller.dart' as _i895;
import '../connection/socket/socket_controller.dart' as _i496;
import '../connection/storage/storage.dart' as _i741;
import '../features/games/controllers/games_list_controller.dart' as _i747;
import '../features/package_upload/controllers/package_upload_controller.dart'
    as _i905;
import '../features/packages/controllers/packages_list_controller.dart'
    as _i793;
import 'controllers/load_controller.dart' as _i676;
import 'controllers/time_controller.dart' as _i697;
import 'router.dart' as _i216;

extension GetItInjectableX on _i174.GetIt {
// initializes the registration of main-scope dependencies inside of GetIt
  Future<_i174.GetIt> init({
    String? environment,
    _i526.EnvironmentFilter? environmentFilter,
  }) async {
    final gh = _i526.GetItHelper(
      this,
      environment,
      environmentFilter,
    );
    gh.singleton<_i216.AppRouter>(() => _i216.AppRouter());
    gh.singleton<_i697.TimeController>(() => _i697.TimeController()..init());
    gh.singleton<_i676.LoadController>(() => _i676.LoadController());
    gh.singleton<_i419.Oauth2Controller>(() => _i419.Oauth2Controller());
    gh.singleton<_i741.Storage>(() => _i741.Storage());
    await gh.singletonAsync<_i895.DioController>(
      () {
        final i = _i895.DioController();
        return i.init().then((_) => i);
      },
      preResolve: true,
    );
    gh.singleton<_i905.PackageUploadController>(
        () => _i905.PackageUploadController());
    gh.singleton<_i149.Api>(() => _i149.Api());
    await gh.singletonAsync<_i785.AuthController>(
      () {
        final i = _i785.AuthController();
        return i.init().then((_) => i);
      },
      preResolve: true,
    );
    await gh.singletonAsync<_i496.SocketController>(
      () {
        final i = _i496.SocketController();
        return i.init().then((_) => i);
      },
      preResolve: true,
    );
    await gh.singletonAsync<_i793.PackagesListController>(
      () {
        final i = _i793.PackagesListController();
        return i.init().then((_) => i);
      },
      preResolve: true,
    );
    await gh.singletonAsync<_i747.GamesListController>(
      () {
        final i = _i747.GamesListController();
        return i.init().then((_) => i);
      },
      preResolve: true,
    );
    return this;
  }
}
