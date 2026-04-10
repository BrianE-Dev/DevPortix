import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock3, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import LocalStorageService from '../services/localStorageService';
import { communityApi } from '../services/communityApi';
import { useModal } from '../hooks/useModal';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { ROLES } from '../utils/constants';
import { resolveMediaUrl } from '../utils/api';
import { DEVPORTIX_BLOG_TEMPLATES, DEVPORTIX_BLOG_TOPICS, DEVPORTIX_EDITORIAL_BLOGS } from '../data/communityEditorial';

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
  if (post?.excerpt) return post.excerpt;
  const content = String(post?.content || '').trim();
  if (content.length <= 150) return content;
  return `${content.slice(0, 150).trim()}...`;
};

const loadEditorialLikes = () => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem('devportix_editorial_blog_likes');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const loadEditorialComments = () => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem('devportix_editorial_blog_comments');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const CommunityPage = () => {
  const { confirm } = useModal();
  const { user, isAuthenticated } = useAuth();
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
  const [editorialLikes, setEditorialLikes] = useState(() => loadEditorialLikes());
  const [editorialComments, setEditorialComments] = useState(() => loadEditorialComments());
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const editorialBlogs = useMemo(() => DEVPORTIX_EDITORIAL_BLOGS, []);
  const savedTopics = useMemo(() => DEVPORTIX_BLOG_TOPICS, []);
  const blogTemplates = useMemo(() => DEVPORTIX_BLOG_TEMPLATES, []);
  const topicTemplateMap = useMemo(
    () =>
      new Map(
        blogTemplates.map((template) => [String(template.title || '').trim().toLowerCase(), template])
      ),
    [blogTemplates]
  );

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
    setSelectedTemplateId('');
    setMediaPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return '';
    });
  }, []);

  const loadPosts = useCallback(async () => {
    if (tab === 'people') return;
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
    if ((tab === 'people' || tab === 'chat') && !token) {
      setLoading(false);
      return;
    }
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
    if (!token) {
      setError('Please register or sign in to comment on blog posts.');
      return;
    }

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

  const toggleEditorialLike = (postId) => {
    setEditorialLikes((prev) => {
      const next = {
        ...prev,
        [postId]: !prev[postId],
      };

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('devportix_editorial_blog_likes', JSON.stringify(next));
      }

      return next;
    });
  };

  const addEditorialComment = (postId) => {
    if (!isAuthenticated) {
      setError('Please register or sign in to comment on blog posts.');
      return;
    }

    const text = String(commentDrafts[postId] || '').trim();
    if (!text) return;

    setEditorialComments((prev) => {
      const nextComment = {
        id: `editorial-comment-${Date.now()}`,
        content: text,
        createdAt: new Date().toISOString(),
        author: {
          fullName: user?.fullName || user?.username || 'DevPortix User',
        },
      };

      const next = {
        ...prev,
        [postId]: [...(prev[postId] || []), nextComment],
      };

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('devportix_editorial_blog_comments', JSON.stringify(next));
      }

      return next;
    });

    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    setError('');
  };

  const loadBlogTemplate = (template) => {
    setTab('blog');
    setEditing(null);
    setSelectedTemplateId(template.id || '');
    setTitle(template.title || '');
    setContent(template.content || '');
    setMedia(null);
    setError('');
    setMediaPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return '';
    });
  };

  const handleTopicClick = (topic) => {
    setTab('blog');
    const matchedTemplate = topicTemplateMap.get(String(topic || '').trim().toLowerCase());

    if (matchedTemplate) {
      loadBlogTemplate(matchedTemplate);
      return;
    }

    setSelectedTemplateId('');
    setTitle(topic);
    setContent('');
    setMedia(null);
    setEditing(null);
    setError('');
    setMediaPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
      return '';
    });
  };

  const mergedBlogPosts = useMemo(() => {
    const apiBlogs = Array.isArray(posts) ? posts : [];
    const apiTitles = new Set(apiBlogs.map((post) => String(post?.title || '').trim().toLowerCase()));
    const editorialOnly = editorialBlogs.filter(
      (post) => !apiTitles.has(String(post?.title || '').trim().toLowerCase())
    );
    return [...editorialOnly, ...apiBlogs];
  }, [editorialBlogs, posts]);

  const mergedRecentBlogs = useMemo(() => {
    const combined = [...editorialBlogs, ...(recentBlogs || [])];
    const seen = new Set();
    return combined.filter((post) => {
      const key = String(post?.title || post?.id || '').trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 5);
  }, [editorialBlogs, recentBlogs]);

  const mergedMostLikedBlogs = useMemo(() => {
    const combined = [...editorialBlogs, ...(mostLikedBlogs || [])];
    const seen = new Set();
    return combined
      .filter((post) => {
        const key = String(post?.title || post?.id || '').trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => Number(b.likeCount || b.upvoteCount || 0) - Number(a.likeCount || a.upvoteCount || 0))
      .slice(0, 5);
  }, [editorialBlogs, mostLikedBlogs]);

  const displayPosts = tab === 'blog' ? mergedBlogPosts : posts;
  const activeTemplate =
    blogTemplates.find((template) => template.id === selectedTemplateId) || blogTemplates[0] || null;

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
        !isAuthenticated ? (
          <div className="mt-6 rounded-[2rem] border border-sky-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Create an account to explore people</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Blog reading is open to everyone, but the people directory and friend requests are available after registration.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/signup" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white">
                Register
              </Link>
              <Link to="/login" className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700">
                Sign In
              </Link>
            </div>
          </div>
        ) : (
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
        )
      ) : (
        <div className={`mt-6 grid gap-6 ${tab === 'blog' ? 'xl:grid-cols-[minmax(0,1.4fr)_320px]' : ''}`}>
          <div className="space-y-5">
            {tab === 'chat' && !isAuthenticated ? (
              <div className="rounded-[2rem] border border-sky-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Sign in to join community chats</h2>
                <p className="mt-2">
                  Blog reading and liking are public now, but posting chats still requires an account.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link to="/signup" className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white">
                    Register
                  </Link>
                  <Link to="/login" className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700">
                    Sign In
                  </Link>
                </div>
              </div>
            ) : tab === 'chat' || isSuperAdmin ? (
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
                  <>
                    <div className="mt-4 rounded-[1.5rem] border border-sky-100 bg-sky-50/80 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Template Library</p>
                          <h3 className="mt-2 text-base font-semibold text-slate-900">Quick-start DevPortix blog drafts</h3>
                          <p className="mt-1 text-sm text-slate-600">
                            Load a structured draft, replace any section you want, then attach your cover image and publish.
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
                          {blogTemplates.length} ready template{blogTemplates.length === 1 ? '' : 's'}
                        </span>
                      </div>
                      <div className="mt-4 space-y-3">
                        {blogTemplates.map((template) => (
                          <div key={template.id} className="rounded-[1.25rem] border border-white bg-white/90 p-4 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{template.title}</p>
                                <p className="mt-1 text-sm text-slate-600">{template.excerpt}</p>
                              </div>
                              <button
                                type="button"
                                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white"
                                onClick={() => loadBlogTemplate(template)}
                              >
                                Load Draft
                              </button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {template.tags.map((tag) => (
                                <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                  {tag}
                                </span>
                              ))}
                            </div>
                            <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600">
                              Cover note: {template.recommendedCoverNote}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Blog title"
                      className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                    />
                  </>
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
                    <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Publishing Checklist</p>
                      <div className="mt-3 space-y-2">
                        {(activeTemplate?.checklist || []).map((item) => (
                          <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-sky-500" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
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

            {displayPosts.map((post) => {
              const canManagePost = post.type === 'blog' ? isSuperAdmin : post.isOwner;
              const baseLikeCount = Number(post.upvoteCount ?? post.likeCount ?? 0);
              const isEditorial = Boolean(post.editorialMeta);
              const postComments = isEditorial ? editorialComments[post.id] || [] : comments[post.id] || [];
              const commentCount = isEditorial ? postComments.length : Number(post.commentCount || 0);
              const isLiked = isEditorial
                ? Boolean(editorialLikes[post.id])
                : Boolean(post.isLiked || post.isUpvoted);
              const likeCount = isEditorial
                ? baseLikeCount + (isLiked ? 1 : 0)
                : baseLikeCount;
              const coverImage = isEditorial
                ? post.editorialMeta.heroImage
                : post.media?.url
                  ? resolveMediaUrl(post.media.url)
                  : '';
              const inlineImage = post.editorialMeta?.inlineImage;

              return (
                <article
                  key={post.id}
                  className={`overflow-hidden rounded-[2rem] border shadow-sm ${
                    isEditorial
                      ? isDark
                        ? 'border-sky-400/20 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(15,23,42,0.88))]'
                        : 'border-sky-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.94))]'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {isEditorial ? (
                    <div className="border-b border-inherit px-5 py-5 sm:px-7">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? 'bg-sky-500/10 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
                          <Sparkles className="h-3.5 w-3.5" />
                          DevPortix Original
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-violet-500/10 text-violet-200' : 'bg-violet-100 text-violet-700'}`}>
                          {post.editorialMeta.category}
                        </span>
                        <span className={`inline-flex items-center gap-2 text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          <Clock3 className="h-3.5 w-3.5" />
                          {post.editorialMeta.readingTime}
                        </span>
                      </div>
                      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_340px] lg:items-center">
                        <div>
                          <p className={`text-sm font-semibold ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>{post.author?.fullName}</p>
                          <h2 className={`mt-3 text-3xl font-bold leading-tight sm:text-4xl ${isDark ? 'text-white' : 'text-slate-900'}`}>{post.title}</h2>
                          <p className={`mt-4 max-w-2xl text-base leading-8 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{post.excerpt}</p>
                          <div className="mt-6 flex flex-wrap gap-2">
                            {post.editorialMeta.tags.map((tag) => (
                              <span
                                key={tag}
                                className={`rounded-full px-3 py-1 text-xs font-medium ${isDark ? 'bg-white/5 text-slate-200' : 'bg-slate-100 text-slate-700'}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        {coverImage ? (
                          <div className="overflow-hidden rounded-[1.75rem] border border-white/10">
                            <img src={coverImage} alt={post.title} className="h-full min-h-[260px] w-full object-cover" />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className={isEditorial ? 'px-5 py-6 sm:px-7 sm:py-7' : 'p-5'}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className={`text-sm font-semibold ${isDark && isEditorial ? 'text-white' : 'text-slate-900'}`}>{post.author?.fullName}</p>
                      <p className={`mt-1 text-xs uppercase tracking-[0.24em] ${isDark && isEditorial ? 'text-slate-400' : 'text-slate-400'}`}>
                        {post.type} {post.createdAt ? `| ${formatDate(post.createdAt)}` : ''}
                      </p>
                      {post.title && !isEditorial ? <h2 className="mt-3 text-2xl font-semibold text-slate-900">{post.title}</h2> : null}
                    </div>
                    {canManagePost && !isEditorial ? (
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

                  {isEditorial ? (
                    <div className="mt-6 space-y-8">
                      <div className={`grid gap-4 rounded-[1.75rem] border p-5 sm:grid-cols-3 ${isDark ? 'border-white/10 bg-white/5' : 'border-sky-100 bg-sky-50/80'}`}>
                        {post.editorialMeta.keyStats.map((item) => (
                          <div key={item.label} className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</p>
                            <p className={`mt-2 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.value}</p>
                          </div>
                        ))}
                      </div>

                      {post.editorialMeta.sections.map((section, index) => (
                        <div key={section.heading} className={index === 3 && inlineImage ? 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start' : ''}>
                          <div>
                            <h3 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{section.heading}</h3>
                            <div className="mt-4 space-y-4">
                              {section.body.map((paragraph) => (
                                <p key={paragraph} className={`text-sm leading-8 sm:text-[15px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                  {paragraph}
                                </p>
                              ))}
                            </div>
                          </div>
                          {index === 3 && inlineImage ? (
                            <div className="overflow-hidden rounded-[1.5rem] border border-white/10">
                              <img src={inlineImage} alt="Developer reviewing code on screen" className="h-full w-full object-cover" />
                            </div>
                          ) : null}
                        </div>
                      ))}

                      <div className={`rounded-[1.75rem] border p-6 ${isDark ? 'border-violet-400/20 bg-violet-500/10' : 'border-violet-200 bg-violet-50'}`}>
                        <p className={`text-lg font-medium leading-8 ${isDark ? 'text-violet-100' : 'text-violet-900'}`}>"{post.editorialMeta.quote}"</p>
                      </div>

                      <div className={`rounded-[1.75rem] border p-6 ${isDark ? 'border-sky-400/20 bg-sky-500/10' : 'border-sky-200 bg-sky-50'}`}>
                        <p className={`text-sm leading-8 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{post.editorialMeta.closing}</p>
                        <div className={`mt-5 flex flex-wrap gap-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {post.editorialMeta.imageCredits.map((credit) => (
                            <span key={credit}>{credit}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{post.content}</p>
                  )}

                  {post.media?.url && !isEditorial ? (
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
                        isLiked
                          ? 'border-red-200 bg-red-50 text-red-600'
                          : isDark && isEditorial
                            ? 'border-white/10 text-slate-300'
                            : 'border-slate-200 text-slate-600'
                      }`}
                      onClick={() => {
                        if (isEditorial) {
                          toggleEditorialLike(post.id);
                          return;
                        }
                        toggleLike(post.id);
                      }}
                    >
                      <span className={isLiked ? 'text-red-500' : isDark && isEditorial ? 'text-slate-500' : 'text-slate-400'} aria-hidden="true">
                        &#9829;
                      </span>
                      <span>{likeCount}</span>
                    </button>
                    <span className={`text-sm ${isDark && isEditorial ? 'text-slate-400' : 'text-slate-500'}`}>{commentCount} comments</span>
                    {isEditorial ? (
                      <span className={`inline-flex items-center gap-2 text-sm font-medium ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
                        Featured by DevPortix
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-3">
                      {postComments.map((comment) => (
                        <div key={comment.id} className="rounded-2xl bg-slate-50 p-3 text-sm">
                          <p className="font-semibold text-slate-900">{comment.author?.fullName}</p>
                          <p className="mt-1 text-slate-700">{comment.content}</p>
                        </div>
                      ))}

                      <div className="flex gap-2">
                        {isAuthenticated ? (
                          <>
                            <input
                              value={commentDrafts[post.id] || ''}
                              onChange={(event) => setCommentDrafts((prev) => ({ ...prev, [post.id]: event.target.value }))}
                              placeholder="Add comment..."
                              className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm outline-none transition focus:border-slate-400"
                            />
                            <button
                              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                              onClick={() => {
                                if (isEditorial) {
                                  addEditorialComment(post.id);
                                  return;
                                }
                                addComment(post.id);
                              }}
                            >
                              Comment
                            </button>
                          </>
                        ) : (
                          <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
                            <p className="text-sm text-slate-700">Register or sign in to join the conversation.</p>
                            <div className="flex gap-2">
                              <Link to="/signup" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                                Register
                              </Link>
                              <Link to="/login" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                                Sign In
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
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
                  {mergedRecentBlogs.map((post) => (
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
                  {mergedMostLikedBlogs.map((post) => (
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

              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Saved Topic Bank</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {savedTopics.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleTopicClick(topic)}
                      className="rounded-full bg-slate-100 px-3 py-2 text-left text-xs font-medium text-slate-700 transition hover:bg-slate-200"
                    >
                      {topic}
                    </button>
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
