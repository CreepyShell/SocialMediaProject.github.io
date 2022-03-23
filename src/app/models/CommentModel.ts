export interface commentModel{
    id:string | undefined;
    postId:string;
    userId:string;
    commentText:string;
    createdAt:Date | undefined;
    commentId:string | undefined;
}