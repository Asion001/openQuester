import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AppTheme {
  static ThemeData change(ThemeData theme) {
    return theme.copyWith(
      bottomNavigationBarTheme: theme.bottomNavigationBarTheme.copyWith(
        type: BottomNavigationBarType.shifting,
        landscapeLayout: BottomNavigationBarLandscapeLayout.centered,
        selectedItemColor: theme.colorScheme.onPrimary,
        unselectedItemColor: theme.colorScheme.primary,
      ),
      appBarTheme: AppBarTheme(systemOverlayStyle: systemOverlay(theme)),
      pageTransitionsTheme: pageTransitionsTheme,
    );
  }

  static PageTransitionsTheme get pageTransitionsTheme {
    return const PageTransitionsTheme(
      builders: <TargetPlatform, PageTransitionsBuilder>{
        // Set the predictive back transitions for Android.
        TargetPlatform.android: PredictiveBackPageTransitionsBuilder(),
      },
    );
  }

  static SystemUiOverlayStyle systemOverlay(ThemeData theme) {
    return SystemUiOverlayStyle(
      systemNavigationBarColor: theme.colorScheme.surfaceContainer,
      systemNavigationBarDividerColor: theme.colorScheme.surfaceContainer,
    );
  }

  static ThemeData get light => change(ThemeData.light());
  static ThemeData get dark => change(ThemeData.dark());
}
