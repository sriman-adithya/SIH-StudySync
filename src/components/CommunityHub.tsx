import React, { useState } from "react";
import {
  Users,
  MessageSquare,
  HelpCircle,
  Sparkles,
  Heart,
  Send,
  Edit2,
  Trash2,
  Check,
  X,
  Filter,
  Share2,
} from "lucide-react";
import { CommunityPost, CommunityReply } from "../types";

interface CommunityHubProps {
  posts: CommunityPost[];
  onAddPost: (post: Omit<CommunityPost, "id" | "createdAt" | "likes" | "replies">) => void;
  onEditPost: (postId: string, newContent: string) => void;
  onDeletePost: (postId: string) => void;
  onAddReply: (postId: string, content: string) => void;
  onToggleLike: (postId: string) => void;
}

export const CommunityHub: React.FC<CommunityHubProps> = ({
  posts,
  onAddPost,
  onEditPost,
  onDeletePost,
  onAddReply,
  onToggleLike,
}) => {
  const [filterType, setFilterType] = useState<"all" | "doubt" | "insight" | "resource">("all");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostType, setNewPostType] = useState<"doubt" | "insight" | "resource">("doubt");
  const [newPostSubject, setNewPostSubject] = useState("General");

  // Editing state
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Reply input state
  const [replyInputByPost, setReplyInputByPost] = useState<Record<string, string>>({});

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    onAddPost({
      author: "Alex Morgan (You)",
      authorAvatar: "AM",
      isCurrentUser: true,
      subjectTag: newPostSubject.trim() || "General Study",
      type: newPostType,
      content: newPostContent.trim(),
    });

    setNewPostContent("");
  };

  const startEdit = (post: CommunityPost) => {
    setEditingPostId(post.id);
    setEditContent(post.content);
  };

  const saveEdit = (postId: string) => {
    if (!editContent.trim()) return;
    onEditPost(postId, editContent.trim());
    setEditingPostId(null);
    setEditContent("");
  };

  const handleSendReply = (postId: string) => {
    const text = replyInputByPost[postId]?.trim();
    if (!text) return;
    onAddReply(postId, text);
    setReplyInputByPost((prev) => ({ ...prev, [postId]: "" }));
  };

  const filteredPosts = posts.filter((p) => {
    if (filterType === "all") return true;
    return p.type === filterType;
  });

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            StudySync Community Hub
          </h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Ask doubts, share breakthrough insights, or discuss topics. You can unsend or edit your messages anytime.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium">
          {(["all", "doubt", "insight", "resource"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                filterType === t
                  ? "bg-white text-indigo-700 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t === "all" ? "All Posts" : t === "doubt" ? "Doubts" : t === "insight" ? "Insights" : "Tips"}
            </button>
          ))}
        </div>
      </div>

      {/* Post Creator Box */}
      <form
        onSubmit={handleCreatePost}
        className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              AM
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Post to StudySync Learners</p>
              <p className="text-[11px] text-slate-700">Participate in high-yield academic discussions</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tag selector */}
            <select
              value={newPostType}
              onChange={(e) => setNewPostType(e.target.value as any)}
              className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="doubt">❓ Ask a Doubt</option>
              <option value="insight">💡 Share Insight</option>
              <option value="resource">🔗 Study Resource</option>
            </select>

            <input
              type="text"
              value={newPostSubject}
              onChange={(e) => setNewPostSubject(e.target.value)}
              placeholder="Subject (e.g. Physics)"
              className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 w-28 sm:w-32"
            />
          </div>
        </div>

        <textarea
          rows={3}
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder="What doubt are you facing, or what interesting concept did you discover today?"
          className="w-full text-xs text-slate-800 p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-slate-50/40"
        />

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-700">
            Messages can be edited or un-sent anytime to maintain quality discussions.
          </span>
          <button
            type="submit"
            disabled={!newPostContent.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>
        </div>
      </form>

      {/* Posts Feed */}
      <div className="space-y-4">
        {filteredPosts.map((post) => {
          const isEditing = editingPostId === post.id;

          return (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4 hover:border-slate-300 transition-colors"
            >
              {/* Post Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                    {post.authorAvatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{post.author}</span>
                      {post.isCurrentUser && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                          You
                        </span>
                      )}
                      <span className="text-[11px] text-slate-700">• {post.createdAt}</span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          post.type === "doubt"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : post.type === "insight"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {post.type === "doubt" ? "Doubt" : post.type === "insight" ? "Insight" : "Resource"}
                      </span>
                      <span className="text-[11px] font-medium text-slate-700">
                        {post.subjectTag}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit & Unsend Controls for current user */}
                {post.isCurrentUser && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(post)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit this post"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeletePost(post.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Unsend / Delete post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Post Content */}
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full text-xs text-slate-800 p-2.5 rounded-xl border border-indigo-500 bg-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingPostId(null)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(post.id)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              )}

              {/* Likes & Replies Bar */}
              <div className="flex items-center gap-4 pt-2 border-t border-slate-100 text-xs text-slate-700">
                <button
                  onClick={() => onToggleLike(post.id)}
                  className={`flex items-center gap-1.5 hover:text-rose-600 transition-colors ${
                    post.likedByMe ? "text-rose-600 font-semibold" : "text-slate-700"
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${post.likedByMe ? "fill-rose-600 text-rose-600" : ""}`}
                  />
                  <span>{post.likes}</span>
                </button>

                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{post.replies.length} replies</span>
                </span>
              </div>

              {/* Replies Thread */}
              {post.replies.length > 0 && (
                <div className="space-y-2 pt-1 pl-4 border-l-2 border-slate-100">
                  {post.replies.map((rep) => (
                    <div key={rep.id} className="bg-slate-50/70 p-2.5 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{rep.author}</span>
                        <span className="text-[10px] text-slate-700">{rep.createdAt}</span>
                      </div>
                      <p className="text-slate-700">{rep.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={replyInputByPost[post.id] || ""}
                  onChange={(e) =>
                    setReplyInputByPost((prev) => ({ ...prev, [post.id]: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleSendReply(post.id)}
                  placeholder="Write a helpful answer or thought..."
                  className="flex-1 text-xs text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-slate-50/30"
                />
                <button
                  onClick={() => handleSendReply(post.id)}
                  disabled={!replyInputByPost[post.id]?.trim()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Reply
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
