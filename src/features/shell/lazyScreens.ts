/** The back office is a separate chunk; the till and every payment dialog are always in the main bundle. */
export const loadOpsScreen = () => import('../ops/OpsScreen');
/** The kitchen display is only loaded on devices assigned to the kitchen. */
export const loadKitchenScreen = () => import('../kitchen/KitchenDisplay');
