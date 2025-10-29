import React, {
  useState,
  useCallback,
  Suspense,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  fetchAllPosts,
  likePost,
  repostPost,
  commentPost,
  getPostComments,
  getPostReposts,
  Post as PostType,
  // PostRepostUser,
  RepostWithUser,

} from "../../api/Post";
import PostItem, {
  RepostingPost,
  PostCommentUser,
  MediaItem,
} from "./PostItem";
import { useAuth } from "../../context/AuthContext";
import RepostModal from "./RepostModal";
import MediaLightbox from "./MediaLightbox";
import RepostDialog from "./RepostDialog";
// import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useInfiniteQuery, useQueryClient, InfiniteData } from "@tanstack/react-query";


interface CommentFromAPI {
  commentId?: number;
  id?: number;
  content: string;
  createdAt: string;
  user?: {
    id: number;
    name: string;
    email?: string;
  };
}

const Feed: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeCommentPost, setActiveCommentPost] = useState<number | null>(null);
  const [commentTextMap, setCommentTextMap] = useState<Record<number, string>>({});
  const [commentsMap, setCommentsMap] = useState<Record<number, PostCommentUser[]>>({});
  const [reposting, setReposting] = useState<RepostingPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<PostType | null>(null);
  const [lightbox, setLightbox] = useState<{
    media: MediaItem[];
    index: number;
    post: PostType;
    // post?: PostType;
  } | null>(null);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState<number | null>(null);
  const [activeLikesBox, setActiveLikesBox] = useState<number | null>(null);
  const [repostModalPost, setRepostModalPost] = useState<PostType | null>(null);
  // const [repostList, setRepostList] = useState<PostRepostUser[]>([]);
  const [repostList, setRepostList] = useState<RepostWithUser[]>([]);
  const [repostLoading, setRepostLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [repostedPosts, setRepostedPosts] = useState<Set<number>>(new Set());
  const [repostPending, setRepostPending] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  

  const limit = 5;

  
  // const {
  //   data,
  //   fetchNextPage,
  //   hasNextPage,
  //   isFetchingNextPage,
  //   isLoading,
  //   isError,
  // } = useInfiniteQuery<PostType[], Error, PostType[], string[], number>({
  //   queryKey: ["posts"],
  //   queryFn: async ({ pageParam = 1 }: { pageParam?: number }) => {
  //     const res = await fetchAllPosts(pageParam, limit);
  //     return res;
  //   },
  //   getNextPageParam: (lastPage, allPages) =>
  //     lastPage.length < limit ? undefined : allPages.length + 1,
  //   initialPageParam: 1,
  // });

const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
  isError,
} = useInfiniteQuery<PostType[], Error, InfiniteData<PostType[]>, [string], number>({
  queryKey: ["posts"],
  queryFn: async ({ pageParam = 1 }) => {
    const res = await fetchAllPosts(pageParam, limit);
    return res;
  },
  getNextPageParam: (lastPage, allPages) =>
    lastPage.length < limit ? undefined : allPages.length + 1,
  initialPageParam: 1,
});
const posts = useMemo(() => data?.pages.flat() || [], [data]);

useEffect(() => {
  if (posts.length > 0) {
    setLikedPosts(() => {
      const newSet = new Set<number>();
      posts.forEach((p) => {
        if (p.likedByCurrentUser) newSet.add(p.id);
      });
      return newSet;
    });

    setRepostedPosts(() => {
      const newSet = new Set<number>();
      posts.forEach((p) => {
        if (p.repostedByCurrentUser) newSet.add(p.id);
      });
      return newSet;
    });
  }
}, [posts]);

  
  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isLoading, isFetchingNextPage, fetchNextPage, hasNextPage]
  );

  const timeSince = useCallback((dateString: string) => {
    const seconds = Math.floor(
      (new Date().getTime() - new Date(dateString).getTime()) / 1000
    );
    const intervals = [
      { label: "y", seconds: 31536000 },
      { label: "mo", seconds: 2592000 },
      { label: "d", seconds: 86400 },
      { label: "h", seconds: 3600 },
      { label: "m", seconds: 60 },
      { label: "s", seconds: 1 },
    ];
    for (const i of intervals) {
      const count = Math.floor(seconds / i.seconds);
      if (count >= 1) return `${count}${i.label}`;
    }
    return "0s";
  }, []);

  const handleLike = useCallback(
    async (postId: number) => {
      if (!user) return;
      try {
        const data = await likePost(postId);
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        setLikedPosts((prev) => {
          const newSet = new Set(prev);
          // data.liked ? newSet.add(postId) : newSet.delete(postId);
          if (data.liked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });
      } catch (err) {
        console.error(err);
      }
    },
    [user, queryClient]
  );

  const handleRepost = useCallback(
    async (postId: number, comment?: string) => {
      if (!user || repostPending.has(postId)) return;
      setRepostPending((prev) => new Set(prev).add(postId));
      try {
        const data = await repostPost(postId, comment);
        queryClient.invalidateQueries({ queryKey: ["posts"] });
        if (data.reposted)
          setRepostedPosts((prev) => new Set(prev).add(postId));
        setReposting(null);
      } catch (err) {
        console.error(err);
      } finally {
        setRepostPending((prev) => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      }
    },
    [user, repostPending, queryClient]
  );

  const handleRepostFromModal = useCallback(
    async (postToRepost: PostType, thought: string) => {
      await handleRepost(postToRepost.id, thought?.trim() || "");
      setIsModalOpen(null);
    },
    [handleRepost]
  );

  const handleCommentChange = useCallback((postId: number, text: string) => {
    setCommentTextMap((prev) => ({ ...prev, [postId]: text }));
  }, []);

  const handleCommentSubmit = useCallback(
    async (postId: number) => {
      const text = commentTextMap[postId]?.trim();
      if (!text) return;
      setCommentTextMap((prev) => ({ ...prev, [postId]: "" }));
      try {
        const newComment: { comment: CommentFromAPI } = await commentPost(
          postId,
          text
        );
        const safeComment: PostCommentUser = {
          ...newComment.comment,
          user: newComment.comment.user || {
            id: 0,
            name: "Unknown",
            email: "",
          },
        };
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [safeComment, ...(prev[postId] || [])],
        }));
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      } catch (err) {
        console.error(err);
      }
    },
    [commentTextMap, queryClient]
  );

  const handleShowComments = useCallback(
    async (postId: number) => {
      if (activeCommentPost === postId) {
        setActiveCommentPost(null);
        return;
      }
      setActiveCommentPost(postId);
      if (!commentsMap[postId]) {
        try {
          const comments = await getPostComments(postId);
          setCommentsMap((prev) => ({ ...prev, [postId]: comments }));
        } catch (err) {
          console.error(err);
        }
      }
    },
    [activeCommentPost, commentsMap]
  );

  const handleShowReposts = useCallback(async (post: PostType) => {
    setRepostModalPost(post);
    setRepostLoading(true);
    try {
      const reposts = await getPostReposts(post.id);
      setRepostList(reposts);
    } catch {
      setRepostList([]);
    } finally {
      setRepostLoading(false);
    }
  }, []);

  const memoizedPosts = useMemo(
    () =>
      posts.map((post, index) => {
        const isLastPost = index === posts.length - 1;
        return (
          <PostItem
            key={post.id}
            post={post}
            isLiked={likedPosts.has(post.id)}
            isReposted={repostedPosts.has(post.id)}
            isCommentSectionOpen={activeCommentPost === post.id}
            commentText={commentTextMap[post.id] || ""}
            comments={commentsMap[post.id] || []}
            showEmojiPicker={showEmojiPickerFor === post.id}
            isRepostDropdownOpen={
              reposting?.post.id === post.id && reposting.openDropdown
            }
            activeLikesBoxId={activeLikesBox}
            timeSince={timeSince}
            handleLike={handleLike}
            handleShowComments={handleShowComments}
            handleCommentChange={handleCommentChange}
            handleCommentSubmit={handleCommentSubmit}
            handleRepost={handleRepost}
            handleShowReposts={handleShowReposts}
            setLightbox={setLightbox}
            setActiveLikesBox={setActiveLikesBox}
            setShowEmojiPickerFor={setShowEmojiPickerFor}
            setReposting={setReposting}
            setIsModalOpen={setIsModalOpen}
            isLastPost={isLastPost}
            lastPostRef={lastPostRef}
          />
        );
      }),
    [
      posts,
      likedPosts,
      repostedPosts,
      activeCommentPost,
      commentTextMap,
      commentsMap,
      showEmojiPickerFor,
      reposting,
      activeLikesBox,
      timeSince,
      handleLike,
      handleShowComments,
      handleCommentChange,
      handleCommentSubmit,
      handleRepost,
      handleShowReposts,
      setLightbox,
      setActiveLikesBox,
      setShowEmojiPickerFor,
      setReposting,
      setIsModalOpen,
      lastPostRef,
    ]
  );

  if (isLoading) {
    return <p className="text-center p-8">Loading feed...</p>;
  }

  if (isError) {
    return <p className="text-center p-8 text-red-500">Failed to load feed.</p>;
  }

  if (posts.length === 0) {
    return (
      <p className="text-center p-8 text-gray-500">No posts available.</p>
    );
  }

  return (
    <>
      <div className="max-w-[42rem] mx-auto space-y-1 px-1 sm:px-0">
        <Suspense fallback={<p>Loading...</p>}>{memoizedPosts}</Suspense>
        {isFetchingNextPage && (
          <p className="text-center p-4 text-blue-600">Loading more posts...</p>
        )}
      </div>

      <Suspense fallback={null}>
        {isModalOpen && (
          <RepostModal
            post={isModalOpen}
            onClose={() => setIsModalOpen(null)}
            onSubmit={handleRepostFromModal}
          />
        )}
        {lightbox && lightbox.post && (
          <MediaLightbox
            post={lightbox.post}
            media={lightbox.media}
            initialIndex={lightbox.index}
            onClose={() => setLightbox(null)}
          />
        )}
        {repostModalPost && (
          <RepostDialog
            onClose={() => setRepostModalPost(null)}
            reposts={repostList}
            loading={repostLoading}
            originalPost={repostModalPost}
            timeSince={timeSince}
          />
        )}
        {repostModalPost && (
        <RepostDialog
          onClose={() => setRepostModalPost(null)}
          reposts={repostList}
          loading={repostLoading}
          originalPost={repostModalPost}
          timeSince={timeSince}
          postItemProps={{
            isLiked: likedPosts.has(repostModalPost.id),
            isReposted: repostedPosts.has(repostModalPost.id),
            isCommentSectionOpen: activeCommentPost === repostModalPost.id,
            commentText: commentTextMap[repostModalPost.id] || "",
            comments: commentsMap[repostModalPost.id] || [],
            showEmojiPicker: showEmojiPickerFor === repostModalPost.id,
            activeLikesBoxId: activeLikesBox,
            handleLike,
            handleShowComments,
            handleCommentChange,
            handleCommentSubmit,
            handleRepost,
            handleShowReposts,
            setLightbox,
            setActiveLikesBox,
            setShowEmojiPickerFor,
            setReposting,
            setIsModalOpen,
            hideRepostButton: true, // keep the internal repost button hidden
          }}
        />
      )}

      </Suspense>
    </>
  );
};

export default Feed;