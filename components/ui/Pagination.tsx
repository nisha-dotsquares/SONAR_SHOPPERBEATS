"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  totalItems: number;
  limitOptions?: number[];
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalItems,
  limitOptions = [100, 150, 200, 250],
}: PaginationProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Optimistic local value — updates instantly on click, syncs when parent confirms
  const [pendingLimit, setPendingLimit] = useState(itemsPerPage);
  const [limitChanging, setLimitChanging] = useState(false);

  useEffect(() => {
    setPendingLimit(itemsPerPage);
    setLimitChanging(false);
  }, [itemsPerPage]);

  if (totalItems === 0) return null;

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      onPageChange(page);
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newItemsPerPage = Number(e.target.value);
    // Update display immediately so user sees their click registered
    setPendingLimit(newItemsPerPage);
    setLimitChanging(true);
    onItemsPerPageChange(newItemsPerPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", newItemsPerPage.toString());
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(
          <a
            href="#"
            key={i}
            className={i === currentPage ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(i);
            }}
          >
            {i}
          </a>
        );
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        startPage = 1;
        endPage = 5;
      }

      if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
        endPage = totalPages;
      }

      endPage = Math.min(totalPages, endPage);

      if (startPage > 1) {
        pageNumbers.push(
          <a
            href="#"
            key="start"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(1);
            }}
          >
            1
          </a>
        );
        if (startPage > 2) {
          pageNumbers.push(<span key="start-ellipsis">...</span>);
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(
          <a
            href="#"
            key={`page-${i}`}
            className={i === currentPage ? "active" : ""}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(i);
            }}
          >
            {i}
          </a>
        );
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pageNumbers.push(<span key="end-ellipsis">...</span>);
        }
        pageNumbers.push(
          <a
            href="#"
            key="end"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(totalPages);
            }}
          >
            {totalPages}
          </a>
        );
      }
    }

    return pageNumbers;
  };

  return (
    <div
      className="pagination-container"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
      }}
    >
      <div
        className="pagination"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div
          className="page-numbers"
          style={{ display: "flex", alignItems: "center" }}
        >
          {renderPageNumbers()}
          <p style={{ marginRight: "20px" }}>
            Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
            –{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
            items
          </p>
        </div>
        <div
          className="page-limit-selector"
          style={{ display: "flex", alignItems: "center", marginLeft: "20px" }}
        >
          <label htmlFor="itemsPerPage">Items per page:</label>
          <select
            id="itemsPerPage"
            value={pendingLimit}
            onChange={handleItemsPerPageChange}
            disabled={limitChanging}
            style={{
              marginLeft: "10px",
              padding: "5px",
              opacity: limitChanging ? 0.6 : 1,
              cursor: limitChanging ? "wait" : "pointer",
              transition: "opacity 0.15s ease",
            }}
          >
            {limitOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
