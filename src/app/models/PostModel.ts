export interface postModel {
  id: string | undefined;
  userId: string;
  header: string;
  text: string;
  postTopic: string;
  commentIds: string[] | undefined;
  reactionIds: string[] | undefined;
  createdAt: Date | undefined;
  updatedAt: Date | undefined;
}
