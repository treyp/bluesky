import { useEffect, useState } from "react";
import { useAuth } from "../Auth";
import Feed from "../sections/Feed";
import FeedSkeleton from "../sections/FeedSkeleton";
import { useParams } from "react-router-dom";
import PostText from "../sections/PostText";
import Handle from "../sections/Handle";
import { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import {
  OutputSchema,
  QueryParams,
} from "@atproto/api/dist/client/types/app/bsky/feed/getAuthorFeed";
import Avatar from "../sections/Avatar";
import ShowMoreFeed from "../sections/ShowMoreFeed";

const FEED_LIMIT = 50;

export default function Profile() {
  const { state: authState } = useAuth();
  const [isProfileFetching, setIsProfileFetching] = useState(false);
  const [isFeedFetching, setIsFeedFetching] = useState(false);
  const [profile, setProfile] = useState<ProfileViewDetailed>();
  let resetProfile = false;
  const [feed, setFeed] = useState<OutputSchema["feed"]>();
  let resetFeed = false;
  const [cursor, setCursor] = useState<OutputSchema["cursor"]>();
  let resetCursor = false;
  const { authorHandle } = useParams();

  const fetchNextPage = () => {
    if (!authState.agent || !authorHandle) {
      return;
    }
    const feedOptions: QueryParams = { actor: authorHandle, limit: FEED_LIMIT };
    if (cursor && !resetCursor) {
      feedOptions.cursor = cursor;
    }
    setIsFeedFetching(true);
    authState.agent.api.app.bsky.feed
      .getAuthorFeed(feedOptions)
      .then(({ success, data }) => {
        if (!success || !data.feed || !data.cursor) {
          console.error("Timeline fetch failed", success, data);
        }
        console.log("Timeline fetch success", success, data);
        setFeed(((!resetFeed && feed) || []).concat(data.feed));
        setCursor(data.cursor);
        resetFeed = false;
        resetCursor = false;
        setIsFeedFetching(false);
      });
    setIsProfileFetching(true);
    authState.agent.api.app.bsky.actor
      .getProfile({ actor: authorHandle })
      .then(({ success, data }) => {
        if (!success || !data) {
          console.error("Profile fetch failed", success, data);
        }
        console.log("Profile fetch success", success, data);
        setProfile(data);
        resetProfile = false;
        setIsProfileFetching(false);
      });
  };

  useEffect(() => {
    // can't use state setters and readers in the same render,
    // so another variable is required
    resetFeed = true;
    setFeed(undefined);
    resetCursor = true;
    setCursor(undefined);
    resetProfile = true;
    setProfile(undefined);
    fetchNextPage();
  }, [authState.agent, authorHandle]);

  useEffect(() => {
    document.body.scrollTop = document.documentElement.scrollTop = 0;
  }, [authorHandle]);

  const showMore = () => {
    fetchNextPage();
  };

  let avatar = null;
  if (profile) {
    avatar = <Avatar avatar={profile.avatar} handle={authorHandle} />;
    if (profile.avatar) {
      avatar = (
        <a href={profile.avatar} target="_blank">
          {avatar}
        </a>
      );
    }
  }

  return (
    <div className="w-full">
      {((!profile && isProfileFetching) || resetProfile) && (
        <div className="animate-pulse w-full border-b border-gray-800 mb-4 pb-4">
          <div className="-mt-4 bg-base-content h-52" />
          <div className="rounded-full bg-base-content h-24 w-24 ml-2 -mt-12 border-2 border-black"></div>
          <div className="px-2">
            <div className="my-6 w-64 h-2 bg-base-content rounded"></div>
            <div className="my-4 w-48 h-2 bg-base-content rounded"></div>
            <div className="my-4 grid grid-cols-3 gap-4 w-full max-w-xs">
              <div className="h-2 bg-base-content rounded"></div>
              <div className="h-2 bg-base-content rounded"></div>
              <div className="h-2 bg-base-content rounded"></div>
            </div>
            <div className="my-4 w-64 h-2 bg-base-content rounded"></div>
          </div>
        </div>
      )}
      {profile && !resetProfile && (
        <div className="-mt-4 border-b border-gray-800 mb-4 pb-4">
          {profile.banner ? (
            <img src={profile.banner} className="w-full aspect-[3/1]" />
          ) : (
            <div className="bg-primary h-52" />
          )}
          <div className="avatar flex-none ml-2 -mt-12">
            <div className="w-24 rounded-full">{avatar}</div>
          </div>
          <div className="px-2">
            <h2 className="text-2xl">{profile.displayName}</h2>
            <h3 className="text-gray-400">
              @<Handle handle={profile.handle} />
            </h3>
            <div className="my-2 text-sm">
              <strong>{profile.followersCount}</strong> followers ·{" "}
              <strong>{profile.followsCount}</strong> following ·{" "}
              <strong>{profile.postsCount}</strong> posts
            </div>
            {profile.description && <PostText text={profile.description} />}
          </div>
        </div>
      )}
      {(!feed || resetFeed) && isFeedFetching && <FeedSkeleton />}
      {feed && !resetFeed && <Feed feed={feed} />}
      {feed && !resetFeed && (
        <ShowMoreFeed
          loading={isFeedFetching}
          onClick={showMore}
          isMore={feed.length % FEED_LIMIT === 0}
        />
      )}
    </div>
  );
}
