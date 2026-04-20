import Layout from '@/components/ui/Layout';
import '../../styles/auth.css';
import { getMegaMenuData } from '@/lib/utils/getMegaMenuData';
import AuthGuard from './AuthGuard';
import { getFooterMenuData } from '@/lib/utils/getFooterMenuData';

export default async function AuthLayout({ 
    children,
}: {
    children: React.ReactNode
}) {
     const megaMenuData = await getMegaMenuData();
    const footerMenuData = await getFooterMenuData  (); 

  return <Layout megaMenuData={megaMenuData}  footerMenuData={footerMenuData}>   <AuthGuard>{children}</AuthGuard></Layout>;
}


