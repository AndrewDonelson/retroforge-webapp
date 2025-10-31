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
import type * as exampleCarts from "../exampleCarts.js";
import type * as lobbies from "../lobbies.js";
import type * as profiles from "../profiles.js";
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
  exampleCarts: typeof exampleCarts;
  lobbies: typeof lobbies;
  profiles: typeof profiles;
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
