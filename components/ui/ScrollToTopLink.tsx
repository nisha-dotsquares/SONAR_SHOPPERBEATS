"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface ScrollToTopLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function ScrollToTopLink({ href, children, className, ...props }: ScrollToTopLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Scroll to top immediately
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Navigate after a short delay to ensure smooth scroll
    setTimeout(() => {
      router.push(href);
    }, 100);
  };

  return (
    <Link href={href} className={className} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}