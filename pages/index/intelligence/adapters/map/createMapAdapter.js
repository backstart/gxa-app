import { MAP_ADAPTER_TYPES } from './types.js';
import { WebViewMapAdapter } from './WebViewMapAdapter.js';
import { NativeMapAdapter } from './NativeMapAdapter.js';

export function createMapAdapter(type, options = {}) {
  if (type === MAP_ADAPTER_TYPES.NATIVE) {
    return new NativeMapAdapter(options);
  }
  return new WebViewMapAdapter(options);
}
