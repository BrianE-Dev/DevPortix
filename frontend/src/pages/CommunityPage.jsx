import React, { useCallback, useEffect, useMemo, useState } from 'react';
import LocalStorageService from '../services/localStorageService';
import { communityApi } from '../services/communityApi';
import { useModal } from '../hooks/useModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';
const resolveMedia = (url) => (!url ? '' : url.startsWith('http') ? url : `${API_BASE_URL}${url}`);

const CommunityPage = () => {
  const { confirm } = useModal();
  const token = useMemo(() => LocalStorageService.getToken(), []);
  const [tab, setTab] = useState('chat');
  const [posts, setPosts] = useState([]);
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

  const loadPosts = useCallback(async () => {
    if (!token || tab === 'people') return;
    setLoading(true);
    setError('');
    try {
      const postResp = await communityApi.listPosts(token, { type: tab, page: 1, limit: 25 });
      const nextPosts = Array.isArray(postResp.posts) ? postResp.posts : [];
      setPosts(nextPosts);
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
  }, [token, tab]);

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
  }, [token, tab]);

  useEffect(() => {
    if (tab === 'people') loadPeople();
    else loadPosts();
  }, [tab, loadPosts, loadPeople]);

  useEffect(() => () => {
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
    }
  }, [mediaPreviewUrl]);

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
      setTitle('');
      setContent('');
      setMedia(null);
      setMediaPreviewUrl((currentUrl) => {
        if (currentUrl) {
          URL.revokeObjectURL(currentUrl);
        }
        return '';
      });
      setEditing(null);
      await loadPosts();
    } catch (err) {
      setError(err.message || 'Failed to save post');
    }
  };

  const removePost = async (id) => {
    const isConfirmed = await confirm({
      type: 'warning',
      title: 'Delete Post?',
      message: 'Are you sure you want to delete this post?',
      confirmText: 'Yes',
      cancelText: 'No',
    });
    if (!isConfirmed) return;

    try {
      await communityApi.removePost(token, id);
      await loadPosts();
    } catch (err) {
      setError(err.message || 'Failed to delete post');
    }
  };

  const upvote = async (id) => {
    try {
      const res = await communityApi.toggleLike(token, id);
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isUpvoted: res.isUpvoted, upvoteCount: res.upvoteCount } : p))
      );
    } catch (err) {
      setError(err.message || 'Failed to upvote');
    }
  };

  const addComment = async (postId) => {
    const text = String(commentDrafts[postId] || '').trim();
    if (!text) return;
    try {
      const res = await communityApi.createComment(token, postId, { content: text });
      setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), res.comment] }));
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
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

  return (
    <section className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Community</h1>
      <div className="mt-4 flex gap-2">
        <button className="px-3 py-1 border rounded" onClick={() => setTab('chat')}>Chats</button>
        <button className="px-3 py-1 border rounded" onClick={() => setTab('blog')}>Blogs</button>
        <button className="px-3 py-1 border rounded" onClick={() => setTab('people')}>People</button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {tab === 'people' ? (
        <div className="mt-4 space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="border rounded p-3">
              <h2 className="font-semibold text-sm">Incoming Requests</h2>
              {(requests.incoming || []).map((r) => (
                <div key={r.id} className="mt-2 text-sm">
                  <p>{r.requester?.fullName}</p>
                  <div className="flex gap-2 mt-1">
                    <button className="px-2 py-1 border rounded text-xs" onClick={() => respondRequest(r.id, 'accept')}>Accept</button>
                    <button className="px-2 py-1 border rounded text-xs" onClick={() => respondRequest(r.id, 'reject')}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border rounded p-3">
              <h2 className="font-semibold text-sm">Outgoing Requests</h2>
              {(requests.outgoing || []).map((r) => (
                <p key={r.id} className="mt-2 text-sm">{r.recipient?.fullName}</p>
              ))}
            </div>
            <div className="border rounded p-3">
              <h2 className="font-semibold text-sm">Friends</h2>
              {(requests.friends || []).map((f) => (
                <p key={f.id} className="mt-2 text-sm">{f.fullName}</p>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {users.map((user) => (
              <article key={user.id} className="border rounded p-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">{user.fullName}</p>
                  <p className="text-xs text-gray-500">{user.email} | {user.role}</p>
                </div>
                {user.friendshipStatus === 'none' ? (
                  <button className="px-3 py-1 text-xs border rounded" onClick={() => sendFriendRequest(user.id)}>
                    Add Friend
                  </button>
                ) : (
                  <span className="text-xs">{user.friendshipStatus.replace('_', ' ')}</span>
                )}
              </article>
            ))}
          </div>
        </div>
      ) : (
        <>
          <form onSubmit={createOrUpdatePost} className="mt-4 border rounded p-4 space-y-3">
            {tab === 'blog' && (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Blog title"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            )}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={tab === 'blog' ? 'Write blog content...' : 'Write chat message...'}
              className="w-full border rounded px-3 py-2 text-sm"
              rows={4}
            />
            {tab === 'blog' && (
              <>
                <input type="file" onChange={handleMediaChange} className="text-xs" />
                {mediaPreviewUrl && (
                  <div className="rounded border p-2 w-fit">
                    <img src={mediaPreviewUrl} alt="Selected media preview" className="h-24 w-24 object-cover rounded" />
                  </div>
                )}
              </>
            )}
            <button className="px-3 py-2 rounded bg-blue-600 text-white text-sm">
              {editing ? 'Update' : 'Post'}
            </button>
          </form>

          <div className="mt-4 space-y-3">
            {loading ? <p className="text-sm">Loading...</p> : null}
            {posts.map((post) => (
              <article key={post.id} className="border rounded p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{post.author?.fullName}</p>
                    {post.title ? <h2 className="font-bold mt-2">{post.title}</h2> : null}
                  </div>
                  {post.isOwner ? (
                    <div className="flex gap-2">
                      <button className="px-2 py-1 text-xs border rounded" onClick={() => {
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
                      }}>
                        Edit
                      </button>
                      <button className="px-2 py-1 text-xs border rounded" onClick={() => removePost(post.id)}>
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap">{post.content}</p>
                {post.media?.url ? (
                  <div className="mt-2">
                    {(post.media.mimeType || '').startsWith('image/') ? (
                      <img src={resolveMedia(post.media.url)} alt="blog media" className="max-h-80 rounded" />
                    ) : (
                      <a className="text-sm text-blue-600 underline" href={resolveMedia(post.media.url)} target="_blank" rel="noreferrer">Open media</a>
                    )}
                  </div>
                ) : null}
                <div className="mt-3">
                  <button className="px-2 py-1 text-xs border rounded" onClick={() => upvote(post.id)}>
                    {(post.isUpvoted || post.isLiked) ? 'Upvoted' : 'Upvote'} ({Number(post.upvoteCount ?? post.likeCount ?? 0)})
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {(comments[post.id] || []).map((c) => (
                    <div key={c.id} className="text-xs border rounded p-2">
                      <p className="font-semibold">{c.author?.fullName}</p>
                      <p>{c.content}</p>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      value={commentDrafts[post.id] || ''}
                      onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [post.id]: e.target.value }))}
                      placeholder="Add comment..."
                      className="flex-1 border rounded px-2 py-1 text-xs"
                    />
                    <button className="px-2 py-1 text-xs border rounded" onClick={() => addComment(post.id)}>
                      Comment
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default CommunityPage;
