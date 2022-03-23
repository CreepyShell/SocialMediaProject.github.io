export interface reactionModel{
    id:string | undefined;
    userId:string;
    postId:string | undefined;
    commentId:string | undefined;
    isLike:boolean;
    reactedAt:Date | undefined;
}