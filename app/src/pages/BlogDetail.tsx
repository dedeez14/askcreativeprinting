import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, Calendar, Tag } from "lucide-react";
import SEOHead from "../components/SEOHead";
import { useBlog, useBlogs } from "../hooks/useBlogs";
import { formatDate } from "../lib/format";
import { withBase } from "../lib/paths";

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: blog, isLoading, error } = useBlog(slug);
  const { data: allBlogs } = useBlogs();

  if (!slug) return <Navigate to="/blog" replace />;
  if (isLoading) {
    return (
      <div className="bg-white min-h-screen pt-32 pb-16 px-5 md:px-10">
        <div className="max-w-[800px] mx-auto animate-pulse">
          <div className="h-8 bg-forest-900/10 rounded w-3/4 mb-4" />
          <div className="h-4 bg-forest-900/10 rounded w-1/4 mb-8" />
          <div className="aspect-video bg-forest-900/10 rounded mb-8" />
          <div className="space-y-3">
            <div className="h-4 bg-forest-900/10 rounded" />
            <div className="h-4 bg-forest-900/10 rounded" />
            <div className="h-4 bg-forest-900/10 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }
  if (error || !blog) return <Navigate to="/blog" replace />;

  const publishedDate = formatDate(blog.published_at);

  const related = (allBlogs || [])
    .filter((b: any) => b.slug !== blog.slug)
    .slice(0, 3);

  return (
    <>
      <SEOHead
        title={blog.meta_title || `${blog.title} | ASK Creative Blog`}
        description={blog.meta_description || blog.excerpt || ""}
        keywords={blog.tags?.join(", ") || "ASK Creative blog, printing tips Sabah"}
        canonical={`/blog/${blog.slug}`}
        ogImage={blog.image_url || blog.image_path || undefined}
        ogType="article"
        publishedTime={blog.published_at || undefined}
        articleSection={blog.category || undefined}
        articleTags={blog.tags || undefined}
      />

      {/* Hero */}
      <section className="bg-[#0d1f16] pt-32 md:pt-40 pb-16 md:pb-20">
        <div className="max-w-[800px] mx-auto px-5 md:px-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-white/60 hover:text-[#d7ff00] text-sm font-body mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
          {blog.category && (
            <p className="text-[#d7ff00] text-xs font-body font-medium uppercase tracking-[0.1em] mb-4">
              {blog.category}
            </p>
          )}
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-white uppercase leading-[1.05] mb-5">
            {blog.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-white/50 text-sm font-body">
            {publishedDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {publishedDate}
              </span>
            )}
            {blog.tags && blog.tags.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> {blog.tags.slice(0, 3).join(", ")}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Featured image */}
      {blog.image_url && (
        <section className="bg-white pt-10">
          <div className="max-w-[960px] mx-auto px-5 md:px-10">
            <img
              src={blog.image_url}
              alt={blog.title}
              className="w-full rounded-lg object-cover aspect-video"
            />
          </div>
        </section>
      )}

      {/* Content */}
      <section className="bg-white py-12 md:py-16">
        <article className="max-w-[760px] mx-auto px-5 md:px-10">
          <div
            className="prose prose-lg max-w-none font-body text-forest-900/85 leading-relaxed
              [&_h2]:font-display [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:text-forest-900 [&_h2]:uppercase [&_h2]:mt-10 [&_h2]:mb-4
              [&_h3]:font-display [&_h3]:text-xl [&_h3]:md:text-2xl [&_h3]:text-forest-900 [&_h3]:mt-8 [&_h3]:mb-3
              [&_p]:mb-4
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1.5
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1.5
              [&_li]:text-forest-900/80
              [&_a]:text-teal-600 [&_a]:underline hover:[&_a]:text-teal-700
              [&_strong]:text-forest-900 [&_strong]:font-medium"
            dangerouslySetInnerHTML={{ __html: blog.content || "" }}
          />
        </article>
      </section>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="bg-off-white py-16 md:py-20">
          <div className="max-w-[1280px] mx-auto px-5 md:px-10">
            <h3 className="font-display text-2xl md:text-3xl text-forest-900 uppercase mb-8">
              More from the Blog
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.map((r: any) => (
                <Link
                  key={r.slug}
                  to={`/blog/${r.slug}`}
                  className="group block bg-white rounded-lg overflow-hidden border border-forest-900/10 hover:border-forest-900/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="overflow-hidden">
                    <img
                      src={r.image_url || r.image_path || withBase("/images/blog-1.jpg")}
                      alt={r.title}
                      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    {r.category && (
                      <p className="text-teal-600 text-xs font-body uppercase tracking-wider mb-2">{r.category}</p>
                    )}
                    <h4 className="text-forest-900 text-base font-body font-medium line-clamp-2 group-hover:text-teal-600 transition-colors">
                      {r.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-forest-900 py-16 md:py-20">
        <div className="max-w-[720px] mx-auto px-5 md:px-10 text-center">
          <h3 className="font-display text-2xl md:text-3xl text-white uppercase mb-4">
            Ready to Start Your Project?
          </h3>
          <p className="text-white/60 text-base font-body mb-6">
            Get a quote in 24 hours — share your design and quantity.
          </p>
          <Link
            to="/quotation"
            className="inline-block bg-[#d7ff00] text-[#0d1f16] px-6 py-3 rounded-md text-sm font-body font-medium hover:bg-[#e5ff4d] transition-colors"
          >
            Request a Quotation
          </Link>
        </div>
      </section>
    </>
  );
}
