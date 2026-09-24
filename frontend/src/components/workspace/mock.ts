import type { User } from "#/lib/types/auth.type";
import type { Workspace } from "#/lib/types/workspace.type";

export const UserData:User={
    id:"1",
    avatar_url:"",
    created_at:"",
    username:"John doe",
    email:"john@gmail.com",
    password:"asdfa"
}

export const WorkspaceData:Workspace[]=[
    {
    id:"a",
    created_at:"",
    created_by:"random",
    invite_code:"invite code",
    invite_expires_at:"",
    is_private:true,
    name:"levelup",
    slug:"levelup001"
}
]