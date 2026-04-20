"use client";

import Link from "next/link";
import { useSelector } from "react-redux";

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface BreadcrumbProps {
  from?: string;
}

const Breadcrumb = ({ from }: BreadcrumbProps) => {
interface BreadcrumbState {
  categoryHistory: BreadcrumbItem[];
}

const categoryHistory = useSelector(
  (state: { breadcrumb: BreadcrumbState }) => state.breadcrumb.categoryHistory
);


  if (!categoryHistory || categoryHistory.length === 0) return null;

  return (
    <div className="breadcrumb">
      <div className={from === "detail" ? "" : "container"}>
        <ul className="breadcrumb-list">
          {categoryHistory.map((item, index) => (
            <li key={item.path}>
              {index > 0 && (
                <span>
                  <i className="fa fa-angle-right"></i>
                </span>
              )}
              <Link href={item.path}>{item.name}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Breadcrumb;
