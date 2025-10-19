import { useFocusable } from "@noriginmedia/norigin-spatial-navigation";
import { isTVDevice } from "../../utils/deviceDetection";

export const useConditionalFocusable = (
  config: Parameters<typeof useFocusable>[0]
) => {
  const isTV = isTVDevice();

  // Always call the hook to avoid conditional hook calls
  // But disable focusable when not on TV to prevent registration issues
  const spatialNavigationResult = useFocusable({
    ...(config || {}),
    focusable: isTV ? (config?.focusable ?? true) : false,
  });

  // Extract the properties we need and conditionally override them
  const {
    ref: originalRef,
    focused: originalFocused,
    hasFocusedChild: originalHasFocusedChild,
    ...rest
  } = spatialNavigationResult;

  return {
    ...rest,
    // Always use the original ref from useFocusable to avoid "node: null" warnings
    // Even with focusable: false, the library needs a valid node reference
    ref: originalRef,
    focused: isTV ? originalFocused : false,
    hasFocusedChild: isTV ? originalHasFocusedChild : false,
    isSpatialNavigationEnabled: isTV,
  };
};
