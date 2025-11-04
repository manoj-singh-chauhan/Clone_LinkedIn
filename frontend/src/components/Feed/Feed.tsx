import React, {
  useState,
  useCallback,
  Suspense,
  useMemo,
  useRef,
  lazy,
} from "react";
import {
  fetchAllPosts,
  Post as PostType,
  updatePost,
  deletePost,
} from "../../api/Post";
import PostItem from "./PostItem";
// import { useAuth } from "../../context/AuthContext";
import {
  useInfiniteQuery,
  useQueryClient,
  InfiniteData,
  useMutation,
} from "@tanstack/react-query";

const PostDialog = lazy(() => import("../PostDialogs/PostDialog"));
const DeleteConfirmModal = lazy(() => import("./DeleteConfirmModal"));

const Feed: React.FC = () => {
  // const { user } = useAuth();
  const queryClient = useQueryClient();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const limit = 5;

  const [editingPost, setEditingPost] = useState<PostType | null>(null);
  const [postToDelete, setPostToDelete] = useState<PostType | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery<
    PostType[],
    Error,
    InfiniteData<PostType[]>,
    [string],
    number
  >({
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

  const updatePostMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: number; content: string }) =>
      updatePost(postId, { content }),

    onSuccess: (updatedPost) => {
      queryClient.setQueryData<InfiniteData<PostType[]>>(
        ["posts"],
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.map((post) =>
                post.id === updatedPost.id ? updatedPost : post
              )
            ),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setEditingPost(null);
    },

    onError: (error) => {
      console.error("Failed to update post:", error);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: number) => deletePost(postId),
    onSuccess: (data, postId) => {
      queryClient.setQueryData<InfiniteData<PostType[]>>(
        ["posts"],
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.filter((post) => post.id !== postId)
            ),
          };
        }
      );
    },
    onError: (error) => {
      console.error("Failed to delete post:", error);
    },
  });

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

  const handleEditClick = useCallback((post: PostType) => {
    setEditingPost(post);
  }, []);

  const handleEditClose = useCallback(() => {
    setEditingPost(null);
  }, []);

  const handleEditSubmit = useCallback(
    (newContent: string) => {
      if (!editingPost) return;
      updatePostMutation.mutate({
        postId: editingPost.id,
        content: newContent,
      });
    },
    [editingPost, updatePostMutation]
  );

  const handleDeleteClick = useCallback((post: PostType) => {
    setPostToDelete(post);
  }, []);

  const onConfirmDelete = () => {
    if (postToDelete) {
      deletePostMutation.mutate(postToDelete.id);
      setPostToDelete(null);
    }
  };

  if (isLoading) return <p className="text-center p-8">Loading feed...</p>;
  if (isError)
    return <p className="text-center p-8 text-red-500">Failed to load feed.</p>;
  if (posts.length === 0)
    return <p className="text-center p-8 text-gray-500">No posts available.</p>;

  return (
    <>
      <div className="max-w-[42rem] mx-auto space-y-1 px-1 sm:px-0">
        <Suspense fallback={<p>Loading posts...</p>}>
          {posts.map((post, index) => {
            const isLastPost = index === posts.length - 1;
            return (
              <PostItem
                key={post.id}
                post={post}
                timeSince={timeSince}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                isLastPost={isLastPost}
                lastPostRef={lastPostRef}
              />
            );
          })}
        </Suspense>
        {isFetchingNextPage && (
          <p className="text-center p-4 text-blue-600">Loading more posts...</p>
        )}
      </div>

      <Suspense fallback={null}>
        {editingPost && (
          <PostDialog
            close={handleEditClose}
            onSubmit={handleEditSubmit}
            isEditing={true}
            initialContent={editingPost.content || ""}
            initialMedia={editingPost.media}
          />
        )}
        <DeleteConfirmModal
          isOpen={!!postToDelete}
          onClose={() => setPostToDelete(null)}
          onConfirm={onConfirmDelete}
          title="Delete post?"
          message={`Are you sure you want to permanently remove this post from Linkedin`}
        />
      </Suspense>
    </>
  );
};

export default Feed;