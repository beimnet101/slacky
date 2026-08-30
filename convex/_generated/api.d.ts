/* prettier-ignore-start */

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as activeConferences from "../activeConferences.js";
import type * as auth from "../auth.js";
import type * as calls from "../calls.js";
import type * as canvases from "../canvases.js";
import type * as channels from "../channels.js";
import type * as conferences from "../conferences.js";
import type * as conversations from "../conversations.js";
import type * as http from "../http.js";
import type * as jira from "../jira.js";
import type * as jiraHelpers from "../jiraHelpers.js";
import type * as members from "../members.js";
import type * as mentions from "../mentions.js";
import type * as messages from "../messages.js";
import type * as privatechannelmembers from "../privatechannelmembers.js";
import type * as reactions from "../reactions.js";
import type * as upload from "../upload.js";
import type * as users from "../users.js";
import type * as workspaces from "../workspaces.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activeConferences: typeof activeConferences;
  auth: typeof auth;
  calls: typeof calls;
  canvases: typeof canvases;
  channels: typeof channels;
  conferences: typeof conferences;
  conversations: typeof conversations;
  http: typeof http;
  jira: typeof jira;
  jiraHelpers: typeof jiraHelpers;
  members: typeof members;
  mentions: typeof mentions;
  messages: typeof messages;
  privatechannelmembers: typeof privatechannelmembers;
  reactions: typeof reactions;
  upload: typeof upload;
  users: typeof users;
  workspaces: typeof workspaces;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

/* prettier-ignore-end */
