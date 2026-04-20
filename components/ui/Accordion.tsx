"use client";
import { useState, useEffect } from "react";
import '../../styles/accordion.css'

interface AccordionItem {
  title: string | React.ReactNode;
  content: React.ReactNode;
  defaultOpen?: boolean;
  id: string;
}

interface AccordionProps {
  items: AccordionItem[];
  variation?: 1 | 2;
}

const Accordion = ({ items, variation = 1 }: AccordionProps) => {
  const [openItems, setOpenItems] = useState(items.map((item) => !!item.defaultOpen));

  useEffect(() => {
    setOpenItems((prev) =>
      items.map((item, i) => item.defaultOpen || prev[i] || false)
    );
  }, [items]);

  const toggleItem = (index: number) => {
    setOpenItems((prevOpenItems) => {
      const newOpenItems = [...prevOpenItems];
      newOpenItems[index] = !newOpenItems[index];
      return newOpenItems;
    });
  };

  if (variation === 2) {
    return (
      <div>
        {items.map((item, index) => (
         <div key={item.id}  className="filter-tab-2">
          <h3 style={{ margin: 0 }}>
            <button
              type="button"
              onClick={() => toggleItem(index)}
              aria-expanded={openItems[index]}
            >
              <div className="dflex justify-between">
                {item.title}
                <span>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`chevron ${openItems[index] ? "open" : ""}`}
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="black"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
            </div>
          </button>
        </h3>

        {openItems[index] && <div>{item.content}</div>}
      </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {items.map((item, index) => (
        <div key={index} className="filter-tab ">
          <button
            type="button"
            onClick={() => toggleItem(index)}
            aria-expanded={openItems[index]}
          >
            <h3 >
              <div className="dflex justify-between w-100">
                {item.title}
                <span>
                  <i
                    className={`fa ${openItems[index] ? "fa-minus" : "fa-plus"}`}
                    aria-hidden="true"
                  ></i>
                </span>
              </div>
            </h3>
          </button>
          {openItems[index] && <div className="" style={{ maxHeight: "24rem", overflowY: "auto" }}>{item.content}</div>}
        </div>
      ))}
    </div>
  );
};

export default Accordion;
