import Head from "next/head";
import { MetaInfo } from "@/types/seo";

const DynamicHead = ({ metadata, cookie_logo }: { metadata: MetaInfo, cookie_logo?: string | null }) => {
  const {
    canonical_url,
    description,
    keywords,
    title,
    og_image,
    og_title,
    twitter_cards_site,
    twitter_cards_title,
    twitter_cards_type,
    robots,
    ga4,
    gtm,
    code_container
  } = metadata;

  const extractScripts = (head: string | undefined) => {
    if (!head) return [];
    const scriptRegex = /<script([^>]*)>(.*?)<\/script>/gi;
    const matches = [];
    let match;
    while ((match = scriptRegex.exec(head)) !== null) {
      const attributes = match[1]?.trim();
      const content = match[2]?.trim() || null;
      const srcMatch = attributes.match(/src="([^"]*)"/);
      const typeMatch = attributes.match(/type="([^"]*)"/);
      const scriptType = typeMatch ? typeMatch[1] : "text/javascript";

      matches.push({
        src: srcMatch ? srcMatch[1] : null,
        content: content || null,
        type: scriptType,
      });
    }
    return matches;
  };

  const headScripts = extractScripts(code_container?.head);

  return (
    <>
      <Head>
        <title>{title || "ShopperBeats"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="robots" content={robots || "index, follow"} />
        {canonical_url && <link rel="canonical" href={canonical_url} />}
        {description && <meta name="description" content={description} />}
        {keywords && <meta name="keywords" content={keywords} />}
        {og_title && <meta property="og:title" content={og_title} />}
        {og_image?.[0] && <meta property="og:image" content={og_image[0]} />}
        {twitter_cards_site && <meta name="twitter:site" content={twitter_cards_site} />}
        {twitter_cards_title && <meta name="twitter:title" content={twitter_cards_title} />}
        {twitter_cards_type && <meta name="twitter:card" content={twitter_cards_type} />}

        {headScripts.map((script, index) => {
          if (script.src) {
            return <script key={`script-src-${index}`} src={script.src} async></script>;
          } else if (script.content) {
            return (
              <script
                type={script.type || "text/javascript"}
                key={`script-content-${index}`}
                dangerouslySetInnerHTML={{ __html: script.content }}
              />
            );
          }
          return null;
        })}

        {ga4 && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`}></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${ga4}');
                `,
              }}
            />
          </>
        )}

        {cookie_logo && (
          <style dangerouslySetInnerHTML={{
            __html: `
              .osano-cm-widget {
                background-image: url(${cookie_logo});
                background-size: contain;
                border-radius: 100%;
                width: 40px;
                height: 40px;
                right: 1rem;
                bottom: 1rem;
                opacity: 0.9;
              }
              .osano-cm-widget svg { display: none; }
            `
          }} />
        )}

        {gtm && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtm}');
              `,
            }}
          />
        )}
      </Head>
      {code_container?.body && (
        <script
          dangerouslySetInnerHTML={{
            __html: code_container.body.replace(/<script[^>]*>/g, '').replace(/<\/script>/g, ''),
          }}
        />
      )}
    </>
  );
};

export default DynamicHead;