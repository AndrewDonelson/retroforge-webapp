/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as cartActions from "../cartActions.js";
import type * as cartFiles from "../cartFiles.js";
import type * as carts from "../carts.js";
import type * as createRetroForgeTeam from "../createRetroForgeTeam.js";
import type * as exampleCarts from "../exampleCarts.js";
import type * as follows from "../follows.js";
import type * as interactions from "../interactions.js";
import type * as lobbies from "../lobbies.js";
import type * as profiles from "../profiles.js";
import type * as scheduled from "../scheduled.js";
import type * as stats from "../stats.js";
import type * as syncExampleCarts from "../syncExampleCarts.js";
import type * as webrtc from "../webrtc.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  cartActions: typeof cartActions;
  cartFiles: typeof cartFiles;
  carts: typeof carts;
  createRetroForgeTeam: typeof createRetroForgeTeam;
  exampleCarts: typeof exampleCarts;
  follows: typeof follows;
  interactions: typeof interactions;
  lobbies: typeof lobbies;
  profiles: typeof profiles;
  scheduled: typeof scheduled;
  stats: typeof stats;
  syncExampleCarts: typeof syncExampleCarts;
  webrtc: typeof webrtc;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
