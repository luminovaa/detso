/**
 * Portal.tsx
 *
 * Renders children into the absolute root view tree — circumventing standard Stack Navigators
 * and RNSScreenStack bounds — guaranteeing that it visually overrides native header layouts
 * without losing context of the global NavigationContainer.
 *
 * Internally re-exports `@gorhom/portal` (usually pre-bundled in modern Expo environments).
 *
 * Setup Instructions:
 * In the root entrypoint (`_layout.tsx` or `App.tsx`), wrap the navigator stack with `PortalProvider`:
 * ```tsx
 * import { PortalProvider } from '@gorhom/portal';
 *
 * <PortalProvider>
 *   <RootStack />
 * </PortalProvider>
 * ```
 */

export { Portal } from "@gorhom/portal";
