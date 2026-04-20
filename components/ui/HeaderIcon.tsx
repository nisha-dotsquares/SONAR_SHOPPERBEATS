"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface HeaderIconProps {
  href: string;
  iconSrc: string;
  alt: string;
  className?: string;
}

const HeaderIcon: React.FC<HeaderIconProps> = ({
  href,
  iconSrc,
  alt,
  className = "",
}) => {
  return (
    <div className={`header-link ${className}`}>
      <Link href={href}>
        <Image src={iconSrc} alt={alt} width={20} height={20} />
      </Link>
    </div>
  );
};

export default HeaderIcon;
