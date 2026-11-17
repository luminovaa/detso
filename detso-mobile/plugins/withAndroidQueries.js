const { withAndroidManifest } = require("expo/config-plugins");

/**
 * Expo Config Plugin to declare Android 11+ package visibility (<queries>)
 * for WhatsApp, WhatsApp Business, Maps (geo:), and Dialer (tel:).
 */
module.exports = function withAndroidQueries(config) {
  return withAndroidManifest(config, (modConfig) => {
    const manifest = modConfig.modResults.manifest;
    if (!manifest.queries || manifest.queries.length === 0) {
      manifest.queries = [{ package: [], intent: [] }];
    }

    const queries = manifest.queries[0];
    queries.package = queries.package || [];
    queries.intent = queries.intent || [];

    const requiredPackages = ["com.whatsapp", "com.whatsapp.w4b"];
    for (const pkgName of requiredPackages) {
      const exists = queries.package.some(
        (p) => p.$?.["android:name"] === pkgName
      );
      if (!exists) {
        queries.package.push({ $: { "android:name": pkgName } });
      }
    }

    const requiredIntents = [
      { action: "android.intent.action.VIEW", scheme: "whatsapp" },
      { action: "android.intent.action.VIEW", scheme: "geo" },
      { action: "android.intent.action.DIAL", scheme: "tel" },
    ];

    for (const item of requiredIntents) {
      const exists = queries.intent.some((intent) => {
        const hasAction = intent.action?.some(
          (a) => a.$?.["android:name"] === item.action
        );
        const hasScheme = intent.data?.some(
          (d) => d.$?.["android:scheme"] === item.scheme
        );
        return hasAction && hasScheme;
      });

      if (!exists) {
        queries.intent.push({
          action: [{ $: { "android:name": item.action } }],
          data: [{ $: { "android:scheme": item.scheme } }],
        });
      }
    }

    return modConfig;
  });
};
