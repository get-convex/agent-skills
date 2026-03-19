import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

// PROBLEM: N+1 queries -- each message fetches its author separately
function MessageItem({ message }: { message: any }) {
  const author = useQuery(api.users.getProfile, { userId: message.authorId });

  return (
    <div>
      <strong>{author?.name ?? "Loading..."}</strong>
      <p>{message.body}</p>
    </div>
  );
}

export function MessageList({ channelId }: { channelId: Id<"channels"> }) {
  const messages = useQuery(api.messages.listByChannel, { channelId });

  if (!messages) return <div>Loading...</div>;

  return (
    <div>
      {messages.map((m: any) => (
        <MessageItem key={m._id} message={m} />
      ))}
    </div>
  );
}
