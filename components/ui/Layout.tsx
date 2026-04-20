"use client";

import Header, { MegaMenuCategory } from "./Header";
import Footer from "./Footer";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/redux/store";
import "../../styles/Header.css";
import "../../styles/Footer.css";
import { useGetUserDetailsQuery } from "@/lib/redux/apis/authApi";
import { FooterMenuData } from "@/types/menu";


export default function Layout({
  children,
  megaMenuData,
  footerMenuData,
}: {
  children: React.ReactNode;
  megaMenuData: MegaMenuCategory[];
  footerMenuData: FooterMenuData;
}) {
  const { isLoading } = useSelector((state: RootState) => state.loader);


  return (
    // <div className={isLoading ?"loader-parent":""}>
     <div> 
       {/* {isLoading && (
       <div id="loader">
          <div className="spinner"></div>
         </div>
       )} */}

     {<Header megaMenuData={megaMenuData} />}
      {children}
      <Footer footerMenuData={footerMenuData} />
    </div>
  );
}
