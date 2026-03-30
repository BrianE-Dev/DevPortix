import { useCallback, useEffect, useMemo, useState } from 'react';
import LocalStorageService from '../services/localStorageService';
import { communityApi } from '../services/communityApi';
import { useModal } from '../hooks/useModal';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { ROLES } from '../utils/constants';
import { resolveMediaUrl } from '../utils/api';

const formatDate = (value) => {
  if (!value) return '';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return '';
  }
};

const blogSummary = (post) => {
  const content = String(post?.content || '').trim();
  if (content.length <= 150) return content;
  return `${content.slice(0, 150).trim()}...`;
};

const CommunityPage = () => {
  const { confirm } = useModal();
  const { user } = useAuth();
  const { theme } = useTheme();
  const token = useMemo(() => LocalStorageService.getToken(), []);
  const isDark = theme === 'dark';
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const [tab, setTab] = useState('chat');
  const [posts, setPosts] = useState([]);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [mostLikedBlogs, setMostLikedBlogs] = useState([]);
  const [comments, setComments] = useState({});
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [], friends: [] });
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState('');
  const [editing, setEditing] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const syncPost = useCallback((postId, updater) => {
    const applyUpdate = (collection) =>
      collection.map((post) => (post.id === postId ? updater(post) : post));

    setPosts((prev) => applyUpdate(prev));
    setRecentBlogs((prev) => applyUpdate(prev));
    setMostLikedBlogs((prev) => applyUpdate(prev));
  }, []);

  const clearEditor = useCallback(() => {
    setTitle('');
    setContent('');
    setMedia(null);
    setEditing(null);
    setMediaPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return '';
    });
  }, []);

  const loadPosts = useCallback(async () => {
    if (!token || tab === 'people') return;
    setLoading(true);
    setError('');

    try {
      const requestsToRun =
        tab === 'blog'
          ? Promise.all([
              communityApi.listPosts(token, { type: 'blog', page: 1, limit: 25, sort: 'newest' }),
              communityApi.listPosts(token, { type: 'blog', page: 1, limit: 5, sort: 'newest' }),
              communityApi.listPosts(token, { type: 'blog', page: 1, limit: 5, sort: 'mostLiked' }),
            ])
          : Promise.all([
              communityApi.listPosts(token, { type: 'chat', page: 1, limit: 25, sort: 'newest' }),
            ]);

      const [feedResp, recentResp, likedResp] = await requestsToRun;
      const nextPosts = Array.isArray(feedResp.posts) ? feedResp.posts : [];
      setPosts(nextPosts);
      setRecentBlogs(tab === 'blog' && Array.isArray(recentResp?.posts) ? recentResp.posts : []);
      setMostLikedBlogs(tab === 'blog' && Array.isArray(likedResp?.posts) ? likedResp.posts : []);

      const commentPairs = await Promise.all(
        nextPosts.map(async (post) => {
          const res = await communityApi.listComments(token, post.id);
          return [post.id, Array.isArray(res.comments) ? res.comments : []];
        })
      );
      setComments(Object.fromEntries(commentPairs));
    } catch (err) {
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [tab, token]);

  const loadPeople = useCallback(async () => {
    if (!token || tab !== 'people') return;
    setLoading(true);
    setError('');

    try {
      const [usersResp, reqResp] = await Promise.all([
        communityApi.listUsers(token, { page: 1, limit: 30 }),
        communityApi.listFriendRequests(token),
      ]);
      setUsers(Array.isArray(usersResp.users) ? usersResp.users : []);
      setRequests({
        incoming: Array.isArray(reqResp.incoming) ? reqResp.incoming : [],
        outgoing: Array.isArray(reqResp.outgoing) ? reqResp.outgoing : [],
        friends: Array.isArray(reqResp.friends) ? reqResp.friends : [],
      });
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [tab, token]);

  useEffect(() => {
    if (tab === 'people') loadPeople();
    else loadPosts();
  }, [tab, loadPeople, loadPosts]);

  useEffect(
    () => () => {
      if (mediaPreviewUrl) {
        URL.revokeObjectURL(mediaPreviewUrl);
      }
    },
    [mediaPreviewUrl]
  );

  useEffect(() => {
    if (tab !== 'blog' && editing?.type === 'blog') {
      clearEditor();
    }
  }, [clearEditor, editing?.type, tab]);

  const handleMediaChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setMedia(nextFile);
    setMediaPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      if (nextFile && String(nextFile.type || '').startsWith('image/')) {
        return URL.createObjectURL(nextFile);
      }
      return '';
    });
  };

  const createOrUpdatePost = async (event) => {
    event.preventDefault();
    if (!token || !content.trim()) return;
    if (tab === 'blog' && !title.trim()) return;
    if (tab === 'blog' && !isSuperAdmin) {
      setError('Only super admins can publish blog posts.');
      return;
    }

    setError('');

    try {
      const payload = {
        type: tab,
        title: title.trim(),
        content: content.trim(),
        media: tab === 'blog' ? media : undefined,
      };
      if (editing?.id) {
        await communityApi.updatePost(token, editing.id, payload);
      } else {
        await communityApi.createPost(token, payload);
      }
      clearEditor();
      await loadPosts();
    } catch (err) {
      setError(err.message || 'Failed to save post');
    }
  };

  const removePost = async (post) => {
    const isConfirmed = await confirm({
      type: 'warning',
      title: 'Delete Post?',
      message: 'Are you sure you want to delete this post?',
      confirmText: 'Yes',
      cancelText: 'No',
    });
    if (!isConfirmed) return;

    try {
      await communityApi.removePost(token, post.id);
      if (editing?.id === post.id) {
        clearEditor();
      }
      await loadPosts();
    } catch (err) {
      setError(err.message || 'Failed to delete post');
    }
  };

  const toggleLike = async (postId) => {
    try {
      const res = await communityApi.toggleLike(token, postId);
      syncPost(postId, (post) => ({
        ...post,
        isLiked: res.liked,
        isUpvoted: res.isUpvoted,
        likeCount: res.likeCount,
        upvoteCount: res.upvoteCount,
      }));
    } catch (err) {
      setError(err.message || 'Failed to like post');
    }
  };

  const addComment = async (postId) => {
    const text = String(commentDrafts[postId] || '').trim();
    if (!text) return;

    try {
      const res = await communityApi.createComment(token, postId, { content: text });
      setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), res.comment] }));
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
      syncPost(postId, (post) => ({
        ...post,
        commentCount: Number(post.commentCount || 0) + 1,
      }));
    } catch (err) {
      setError(err.message || 'Failed to comment');
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      await communityApi.sendFriendRequest(token, userId);
      await loadPeople();
    } catch (err) {
      setError(err.message || 'Failed to send friend request');
    }
  };

  const respondRequest = async (requestId, action) => {
    try {
      await communityApi.respondToFriendRequest(token, requestId, action);
      await loadPeople();
    } catch (err) {
      setError(err.message || 'Failed to update friend request');
    }
  };

  const startEditing = (post) => {
    setEditing(post);
    setTitle(post.title || '');
    setContent(post.content || '');
    setMedia(null);
    setMediaPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return '';
    });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={`text-sm font-semibold uppercase tracking-[0.28em] ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Community space</p>
          <h1 className={`mt-2 text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Conversations, blogs, and people</h1>
          <p className={`mt-2 max-w-2xl text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            Super admins handle blog publishing, while everyone else can read, like, and join the discussion.
          </p>
        </div>
        <div className="flex gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          <button
            className={`rounded-full px-4 py-2 text-sm ${tab === 'chat' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
            onClick={() => setTab('chat')}
          >
            Chats
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm ${tab === 'blog' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
            onClick={() => setTab('blog')}
          >
            Blogs
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm ${tab === 'people' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
            onClick={() => setTab('people')}
          >
            People
          </button>
        </div>
      </div>

      {error && <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {tab === 'people' ? (
        <div className="mt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Incoming Requests</h2>
              {(requests.incoming || []).map((request) => (
                <div key={request.id} className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm">
                  <p className="font-medium text-slate-900">{request.requester?.fullName}</p>
                  <div className="mt-2 flex gap-2">
                    <button className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white" onClick={() => respondRequest(request.id, 'accept')}>
                      Accept
                    </button>
                    <button className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700" onClick={() => respondRequest(request.id, 'reject')}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Outgoing Requests</h2>
              {(requests.outgoing || []).map((request) => (
                <p key={request.id} className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                  {request.recipient?.fullName}
                </p>
              ))}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">Friends</h2>
              {(requests.friends || []).map((friend) => (
                <p key={friend.id} className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                  {friend.fullName}
                </p>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {users.map((person) => (
              <article key={person.id} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div>
                  <p className="font-semibold text-slate-900">{person.fullName}</p>
                  <p className="text-sm text-slate-500">
                    {person.email} | {person.role}
                  </p>
                </div>
                {person.friendshipStatus === 'none' ? (
                  <button className="rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700" onClick={() => sendFriendRequest(person.id)}>
                    Add Friend
                  </button>
                ) : (
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    {person.friendshipStatus.replace('_', ' ')}
                  </span>
                )}
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className={`mt-6 grid gap-6 ${tab === 'blog' ? 'xl:grid-cols-[minmax(0,1.4fr)_320px]' : ''}`}>
          <div className="space-y-5">
            {tab === 'chat' || isSuperAdmin ? (
              <form onSubmit={createOrUpdatePost} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {editing ? 'Update your post' : tab === 'blog' ? 'Publish a blog post' : 'Start a conversation'}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {tab === 'blog' ? 'Blogs are reserved for super-admin publishing.' : 'Chats remain open to the community.'}
                    </p>
                  </div>
                  {editing ? (
                    <button
                      type="button"
                      className="rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700"
                      onClick={clearEditor}
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>

                {tab === 'blog' ? (
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Blog title"
                    className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                ) : null}

                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder={tab === 'blog' ? 'Write blog content...' : 'Write chat message...'}
                  className="mt-4 w-full rounded-3xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  rows={tab === 'blog' ? 7 : 4}
                />

                {tab === 'blog' ? (
                  <>
                    <input type="file" onChange={handleMediaChange} className="mt-3 text-xs text-slate-500" />
                    {mediaPreviewUrl ? (
                      <div className="mt-3 w-fit rounded-2xl border border-slate-200 p-2">
                        <img src={mediaPreviewUrl} alt="Selected media preview" className="h-24 w-24 rounded-xl object-cover" />
                      </div>
                    ) : null}
                  </>
                ) : null}

                <button className="mt-4 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white">
                  {editing ? 'Update' : 'Post'}
                </button>
              </form>
            ) : (
              <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 shadow-sm">
                <h2 className="text-lg font-semibold">Blog publishing is limited to super admins</h2>
                <p className="mt-2">
                  You can still read every blog, leave comments, and like posts with the heart button below.
                </p>
              </div>
            )}

            {loading ? <p className="text-sm text-slate-500">Loading...</p> : null}

            {posts.map((post) => {
              const canManagePost = post.type === 'blog' ? isSuperAdmin : post.isOwner;
              const likeCount = Number(post.upvoteCount ?? post.likeCount ?? 0);
              const commentCount = Number(post.commentCount || 0);
              const isLiked = Boolean(post.isLiked || post.isUpvoted);

              return (
                <article key={post.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{post.author?.fullName}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-400">
                        {post.type} {post.createdAt ? `| ${formatDate(post.createdAt)}` : ''}
                      </p>
                      {post.title ? <h2 className="mt-3 text-2xl font-semibold text-slate-900">{post.title}</h2> : null}
                    </div>
                    {canManagePost ? (
                      <div className="flex gap-2">
                        <button
                          className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                          onClick={() => startEditing(post)}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                          onClick={() => removePost(post)}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{post.content}</p>

                  {post.media?.url ? (
                    <div className="mt-4">
                      {(post.media.mimeType || '').startsWith('image/') ? (
                        <img src={resolveMediaUrl(post.media.url)} alt="blog media" className="max-h-96 rounded-[1.5rem] object-cover" />
                      ) : (
                        <a className="text-sm text-blue-600 underline" href={resolveMediaUrl(post.media.url)} target="_blank" rel="noreferrer">
                          Open media
                        </a>
                      )}
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
                    <button
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                        isLiked ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-200 text-slate-600'
                      }`}
                      onClick={() => toggleLike(post.id)}
                    >
                      <span className={isLiked ? 'text-red-500' : 'text-slate-400'} aria-hidden="true">
                        &#9829;
                      </span>
                      <span>{likeCount}</span>
                    </button>
                    <span className="text-sm text-slate-500">{commentCount} comments</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {(comments[post.id] || []).map((comment) => (
                      <div key={comment.id} className="rounded-2xl bg-slate-50 p-3 text-sm">
                        <p className="font-semibold text-slate-900">{comment.author?.fullName}</p>
                        <p className="mt-1 text-slate-700">{comment.content}</p>
                      </div>
                    ))}

                    <div className="flex gap-2">
                      <input
                        value={commentDrafts[post.id] || ''}
                        onChange={(event) => setCommentDrafts((prev) => ({ ...prev, [post.id]: event.target.value }))}
                        placeholder="Add comment..."
                        className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-slate-400"
                      />
                      <button
                        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                        onClick={() => addComment(post.id)}
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {tab === 'blog' ? (
            <aside className="space-y-5">
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Recent Blogs</h2>
                <div className="mt-4 space-y-4">
                  {recentBlogs.map((post) => (
                    <article key={post.id} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{formatDate(post.createdAt)}</p>
                      <h3 className="mt-2 font-semibold text-slate-900">{post.title}</h3>
                      <p className="mt-2 text-sm text-slate-600">{blogSummary(post)}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Most Liked Blogs</h2>
                <div className="mt-4 space-y-4">
                  {mostLikedBlogs.map((post) => (
                    <article key={post.id} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold text-slate-900">{post.title}</h3>
                        <span className="text-sm text-red-500">&#9829; {Number(post.likeCount || post.upvoteCount || 0)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{blogSummary(post)}</p>
                    </article>
                  ))}
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </section>
  );
};

export default CommunityPage;
