import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SEOHead from "../components/SEOHead";
import { useBlogs } from "../hooks/useBlogs";
import { formatDate } from "../lib/format";

interface BlogPost {
  image: string;
  category: string;
  title: string;
  excerpt: string;
  date: string;
  slug?: string;
}

const FALLBACK_POSTS: BlogPost[] = [
  { image: "/images/blog-1.jpg", category: "Jersey Design", title: "How to Design a Custom Football Jersey", excerpt: "Essential steps to create a stunning custom football jersey for your team.", date: "May 15, 2025" },
  { image: "/images/blog-2.jpg", category: "Printing Tips", title: "Sublimation vs Screen Printing", excerpt: "Key differences between sublimation and screen printing.", date: "April 28, 2025" },
  { image: "/images/blog-3.jpg", category: "Corporate Gifts", title: "Top 10 Corporate Gift Ideas for Events in Sabah", excerpt: "Most popular corporate gift options for clients and partners.", date: "April 10, 2025" },
];

export default function Blog() {
  const { data: apiBlogs } = useBlogs();

  const blogPosts: BlogPost[] = useMemo(() => {
    if (apiBlogs && apiBlogs.length > 0) {
      return apiBlogs.map((b: any) => ({
        image: b.image_url || b.image_path || "/images/blog-1.jpg",
        category: b.category || "General",
        title: b.title,
        excerpt: b.excerpt || "",
        date: formatDate(b.published_at),
        slug: b.slug,
      }));
    }
    return FALLBACK_POSTS;
  }, [apiBlogs]);

  return (
    <>
      <SEOHead
        title="Blog & Guides | ASK Creative Printing Tips & Insights"
        description="Tips, insights and guides about custom printing, apparel design and corporate merchandise from ASK Creative in Kota Kinabalu, Sabah."
        keywords="printing blog, custom apparel guide, jersey design tips, corporate gifts ideas, printing tips Sabah"
        canonical="/blog"
      />

      {/* Page Hero */}
      <section className="bg-[#0d1f16] pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10 text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white uppercase leading-[0.95] mb-4">
            Blog & Guides
          </h1>
          <p className="text-white/50 text-lg font-body max-w-[640px] mx-auto">
            Tips, insights and guides about custom printing, apparel design and corporate merchandise.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="bg-white py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-5 md:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, i) => {
              const cardInner = (
                <>
                  <div className="overflow-hidden rounded-t-lg">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 border border-t-0 border-forest-900/15 rounded-b-lg">
                    <p className="text-teal-600 text-xs font-body uppercase tracking-wider mb-2">{post.category}</p>
                    <h3 className="text-forest-900 text-lg font-body font-medium mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-forest-900/60 text-sm font-body line-clamp-3 mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-forest-900/40 text-xs font-body">{post.date}</span>
                      <span className="text-forest-900 text-sm font-body flex items-center gap-1 group-hover:text-teal-600 transition-colors">
                        Read More <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </>
              );
              return post.slug ? (
                <Link key={i} to={`/blog/${post.slug}`} className="group block">
                  {cardInner}
                </Link>
              ) : (
                <article key={i} className="group block">
                  {cardInner}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-off-white py-16 md:py-20">
        <div className="max-w-[720px] mx-auto px-5 md:px-10 text-center">
          <h3 className="font-display text-2xl md:text-3xl text-forest-900 uppercase mb-6">
            Need Help with Your Order?
          </h3>
          <Link
            to="/contact"
            className="inline-block bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors"
          >
            Contact Our Team
          </Link>
        </div>
      </section>
    </>
  );
}
