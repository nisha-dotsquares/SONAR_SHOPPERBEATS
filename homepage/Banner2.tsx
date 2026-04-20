"use client";

import React from "react";
import Image from "next/image";

export default function Banner2() {
  return (
    <div className="sale-banner-2  mt-15 mb-70">
      <div className="container">
        <div className="dflex no-wrap">
          <div className="sale-content align-center">
            <h5>Sony WF-1000XM5 The Best</h5>
            <p>Use Code</p>
            <span className="code btn btn-red btn-filled">SALE20</span>
            <br />
          </div>

          <div className="extra-sale">
            <Image
              src="/images/ear-pods.png"
              alt="Ear Pods"
              width={250}
              height={250}
            />
            <div className="offer-sale">
              Upto
              <br /> 50% off
            </div>
          </div>

          <div className="sale-content">
            <p>- White Apple AirPods 4 w/ ANC</p>
            <p>- In Ear</p>
            <p>- AirPods</p>
            <p>- Wireless</p>
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
