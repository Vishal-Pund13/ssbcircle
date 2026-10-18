import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCommunityFeed } from '../services/api';
import { MessageSquare, ArrowBigUp, ArrowRight } from 'lucide-react';
import CategoryChip, { timeAgo } from './community/CategoryChip';

// A moving strip of recent community posts for the home page, so a first-time
// visitor can see what actually happens here rather than being told.
//
// Renders nothing when there are no posts. An empty ticker advertises an empty
// site, which is the exact problem this is meant to solve.
//
// The track holds the posts twice and slides by half its width, which makes the
// loop seamless. It pauses on hover so a card can be read and clicked, and
// stops entirely for anyone who has asked for reduced motion — continuously
// moving content is a real accessibility problem, not a style preference.

function Card({ post }) {
  return (
    <Link
      to={`/community/${post.id}`}
      className="group w-[265px] sm:w-[300px] shrink-0 bg-white border border-gray-200 rounded-xl px-4 py-3.5 hover:border-brand-300 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between gap-2">
        <CategoryChip category={post.category} />
        <span className="text-[10px] text-gray-400 shrink-0">{timeAgo(post.created_at)}</span>
      </div>

      <p className="mt-2 text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-brand-700 transition-colors">
        {post.title}
      </p>

      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-gray-400">
        <span className="truncate max-w-[110px]">
          {post.is_official
            ? <span className="font-semibold text-brand-600">{post.author_name}</span>
            : (post.author_name || 'Someone')}
        </span>
        <span className="inline-flex items-center gap-1 shrink-0"><ArrowBigUp className="w-3 h-3" />{post.upvotes}</span>
        <span className="inline-flex items-center gap-1 shrink-0"><MessageSquare className="w-3 h-3" />{post.comment_count}</span>
      </div>
    </Link>
  );
}

export default function CommunityHighlights() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getCommunityFeed({ limit: 10 })
      .then(({ posts: list }) => { if (!cancelled) setPosts(list || []); })
      .catch(() => {});       // the home page should never break over this
    return () => { cancelled = true; };
  }, []);

  if (posts.length === 0) return null;

  // With only a couple of posts a moving track looks broken rather than busy,
  // so below four the strip simply sits still.
  const shouldScroll = posts.length >= 4;
  const track = shouldScroll ? [...posts, ...posts] : posts;

  return (
    <section className="border-t border-gray-100 bg-gray-50 py-7 sm:py-9">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-end justify-between gap-4 mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-600">
            From the community
          </p>
          <h2 className="mt-1.5 text-lg sm:text-xl font-bold text-gray-900 leading-tight">
            What aspirants are asking right now
          </h2>
        </div>
        <Link to="/community"
          className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700">
          See all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Full-bleed so cards run off the edge rather than stopping at a margin */}
      <div className="relative overflow-hidden group">
        <div
          className={`flex gap-3 w-max px-4 sm:px-6 ${
            shouldScroll
              ? 'animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none'
              : ''
          }`}>
          {track.map((post, i) => (
            <Card key={`${post.id}-${i}`} post={post} />
          ))}
        </div>

        {/* Soften both edges so cards fade out instead of being cut off */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-gray-50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-gray-50 to-transparent" />
      </div>
    </section>
  );
}
