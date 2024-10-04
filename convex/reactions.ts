 import { QueryCtx,mutation } from "./_generated/server";
 import { Id } from "./_generated/dataModel";
import{v} from"convex/values";
const getMember = async (
    ctx: QueryCtx,
    workspaceId: Id<"workspaces">,
    userId: Id<"users">
) => {
    return ctx.db
        .query("members")
        .withIndex("by_workspace_id_user_id",
            (q) => q.eq("workspaceId", workspaceId).eq("userId", userId)

        ).unique();



};
export const toggle=mutation({
    args:{
      messageId:v.id("messages"),
      value:v.string()

    },
    handler:async()=>{

    }
})