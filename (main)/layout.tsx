import Layout from "@/components/ui/Layout";
import { getMegaMenuData } from "@/lib/utils/getMegaMenuData";
import { getFooterMenuData } from "@/lib/utils/getFooterMenuData";
import Script from "next/script";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [megaMenuData, footerMenuData] = await Promise.all([
    getMegaMenuData(),
    getFooterMenuData(),
  ]);

  return (
    <>
      <Layout megaMenuData={megaMenuData} footerMenuData={footerMenuData}>{children}</Layout>
      <Script
        id="ze-snippet" src="https://static.zdassets.com/ekr/snippet.js?key=e6d7f1c9-46d7-4fcd-b887-54facd6958e5"
        strategy="afterInteractive"
      />
    </>
  )
}
