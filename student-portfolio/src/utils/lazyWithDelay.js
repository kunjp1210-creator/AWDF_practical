import { lazy } from 'react';

/**
 * Wraps dynamic import() with React.lazy and an optional minimum delay.
 * Prevents jarring UI flashes/flickering on fast connections while ensuring
 * smooth transitions for slow network loads.
 *
 * @param {Function} importFn - The dynamic import function (e.g. () => import('./Page'))
 * @param {number} minDelay - Minimum delay in milliseconds (default: 300ms)
 * @returns {React.LazyExoticComponent}
 */
export function lazyWithDelay(importFn, minDelay = 300) {
  return lazy(() =>
    Promise.all([
      importFn(),
      new Promise((resolve) => setTimeout(resolve, minDelay))
    ]).then(([moduleExports]) => moduleExports)
  );
}

export default lazyWithDelay;
