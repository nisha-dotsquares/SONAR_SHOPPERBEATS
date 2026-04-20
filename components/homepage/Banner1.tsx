"use client";

import React from "react";
import Image from "next/image";
import CountdownTimer from "../ui/CountdownTimer";


export default function Banner1() {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 7);

  return (
    <div className="sale-banner mb-70">
      <div className="container">
        <div className="dflex no-wrap">
          <div className="sale-img">
            <img src="/images/headphone.png" alt="Headphone" style={{ width: '100%', height: 'auto', maxWidth: '300px' }} />
          </div>

          <div className="extra-sale">
            <img src="/images/sale.png" alt="Extra Sale" style={{ width: '100%', height: 'auto', maxWidth: '150px' }} />
          </div>

          {/* <CountdownTimer targetDate={targetDate.toISOString()} /> */}

          <div className="sale-content align-center">
            <h5>Sony WF-1000XM5 The Best</h5>
            <p>Use Code</p>
            <span className="code btn btn-red btn-filled">SALE20</span>
            <br />
          </div>

          <div className="sale-btn">
            <a href="/product/49e998d2-718c-4b50-9b4b-5c3639458d35?category=Furniture" className="btn btn-white">
              Shop Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
