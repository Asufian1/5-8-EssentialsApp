// src/components/HomePage.jsx
import React from "react";

function HomePage() {
  return (
    <div id="webcrumbs">
      <div className="bg-neutral-900 min-h-screen text-neutral-100">
        {/* Header */}
        <header className="container mx-auto px-4 py-3 border-b border-neutral-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img
                src="https://www.giantfood.com/themes/custom/giant/logo.svg"
                alt="Giant Logo"
                className="h-10"
              />
            </div>
            <div className="flex-grow mx-8 max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for Easter"
                  className="w-full pl-4 pr-10 py-2 border border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-neutral-800 text-neutral-100"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary-600 transition duration-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center hover:text-primary-600 transition duration-200">
                <span className="font-medium">Sign In</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              <div className="hover:text-primary-600 transition duration-200">
                <span className="font-medium">Shopping List</span>
              </div>
              <div className="flex items-center text-white bg-primary-800 hover:bg-primary-700 transition duration-200 rounded px-3 py-1">
                <span className="font-bold">$0.00</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="border-y border-gray-200 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative group py-3">
                  <button className="flex items-center space-x-1 font-medium hover:text-primary-600 transition duration-200">
                    <span>Categories</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {/* Next: "Add dropdown content for Categories" */}
                </div>
              </div>
              <div className="flex items-center py-3">
                <span className="flex items-center text-gray-700 hover:text-primary-600 transition duration-200 cursor-pointer transform hover:scale-105">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </span>
                {/* Next: "Add location selector dropdown" */}
              </div>
            </div>
          </div>
        </nav>

        {/* Category Icons */}
        <div className="container mx-auto px-4 py-4 bg-neutral-900">
          <div className="relative">
            <div className="flex items-center space-x-2 overflow-hidden">
              {/* For You */}
              <div className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg transition duration-200 cursor-pointer min-w-[80px]">
                <div className="bg-yellow-900 rounded-full p-3 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017a2 2 0 01-1.789-1.106l-3.5-7A2 2 0 017.247 10H12"
                    />
                  </svg>
                </div>
                <span className="text-xs text-center">For You</span>
              </div>

              {/* New Arrivals */}
              <div className="flex flex-col items-center p-2 hover:bg-gray-100 rounded-lg transition duration-200 cursor-pointer min-w-[80px]">
                <div className="bg-purple-900 rounded-full p-3 mb-2">
                  <span className="text-purple-600 font-bold text-xs">NEW</span>
                </div>
                <span className="text-xs text-center">New Arrivals</span>
              </div>

              {/* Our Brands */}
              <div className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg transition duration-200 cursor-pointer min-w-[80px]">
                <div className="bg-white rounded-full p-2 mb-2">
                  <img
                    src="https://www.giantfood.com/themes/custom/giant/logo.svg"
                    alt="Our Brands"
                    className="h-7 w-7"
                  />
                </div>
                <span className="text-xs text-center">Our Brands</span>
              </div>

              {/* View More */}
              <div className="flex flex-col items-center p-2 hover:bg-gray-100 rounded-lg transition duration-200 cursor-pointer min-w-[80px]">
                <div className="bg-neutral-800 rounded-full p-3 mb-2">
                  <span className="text-purple-600 font-bold text-xs">•••</span>
                </div>
                <span className="text-xs text-center flex items-center">
                  View More{" "}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </div>

              {/* Produce */}
              <div className="flex flex-col items-center p-2 hover:bg-gray-100 rounded-lg transition duration-200 cursor-pointer min-w-[80px]">
                <div className="bg-green-100 rounded-full p-3 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-xs text-center">Produce</span>
              </div>

              {/* Meat */}
              <div className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg transition duration-200 cursor-pointer min-w-[80px]">
                <div className="bg-red-900 rounded-full p-3 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
                <span className="text-xs text-center">Meat</span>
              </div>

              {/* Seafood */}
              <div className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg transition duration-200 cursor-pointer min-w-[80px]">
                <div className="bg-blue-900 rounded-full p-3 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <span className="text-xs text-center">Seafood</span>
              </div>

              {/* Deli & Prepared Food */}
              <div className="flex flex-col items-center p-2 hover:bg-gray-100 rounded-lg transition duration-200 cursor-pointer min-w-[80px]">
                <div className="bg-yellow-100 rounded-full p-3 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-xs text-center">Deli & Prepared Food</span>
              </div>

              {/* Dairy & Eggs */}
              <div className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg transition duration-200 cursor-pointer min-w-[80px]">
                <div className="bg-blue-900 rounded-full p-3 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
                <span className="text-xs text-center">Dairy & Eggs</span>
              </div>

              {/* Beverages */}
              <div className="flex flex-col items-center p-2 hover:bg-gray-100 rounded-lg transition duration-200 cursor-pointer min-w-[80px]">
                <div className="bg-blue-900 rounded-full p-3 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-xs text-center">Beverages</span>
              </div>

              {/* Bread & Bakery */}
              <div className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg transition duration-200 cursor-pointer min-w-[80px]">
                <div className="bg-yellow-900 rounded-full p-3 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    />
                  </svg>
                </div>
                <span className="text-xs text-center">Bread & Bakery</span>
              </div>

              {/* Frozen */}
              <div className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg transition duration-200 cursor-pointer min-w-[80px]">
                <div className="bg-blue-900 rounded-full p-3 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <span className="text-xs text-center">Frozen</span>
              </div>

              {/* Rice, Pasta & Beans */}
              <div className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg transition duration-200 cursor-pointer min-w-[80px]">
                <div className="bg-yellow-900 rounded-full p-3 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <span className="text-xs text-center">Rice, Pasta & Beans</span>
              </div>

              {/* Baking & Cooking */}
              <div className="flex flex-col items-center p-2 hover:bg-neutral-800 rounded-lg transition duration-200 cursor-pointer min-w-[80px]">
                <div className="bg-yellow-900 rounded-full p-3 mb-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                    />
                  </svg>
                </div>
                <span className="text-xs text-center">Baking & Cooking</span>
              </div>
            </div>
            <button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-neutral-800 shadow-md rounded-full p-2 hover:bg-neutral-700 transition duration-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative overflow-hidden h-[400px] bg-gradient-to-r from-gray-100 to-white">
          <div className="container mx-auto px-4 h-full">
            <div className="relative h-full">
              {/* Carousel indicators */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-2">
                <button className="h-2 w-2 rounded-full bg-black"></button>
                <button className="h-2 w-2 rounded-full bg-gray-300 hover:bg-gray-400 transition"></button>
                <button className="h-2 w-2 rounded-full bg-gray-300 hover:bg-gray-400 transition"></button>
                <button className="h-2 w-2 rounded-full bg-gray-300 hover:bg-gray-400 transition"></button>
                <button className="h-2 w-2 rounded-full bg-gray-300 hover:bg-gray-400 transition"></button>
                <button className="h-2 w-2 rounded-full bg-gray-300 hover:bg-gray-400 transition"></button>
              </div>

              <div className="grid grid-cols-2 h-full">
                <div className="flex flex-col justify-center pr-8">
                  <h2 className="text-4xl font-bold text-neutral-100 mb-4">
                    Save on your fave personal care
                  </h2>
                  <p className="text-lg text-neutral-300 mb-6">
                    Experience the ultimate self care.
                  </p>
                  <div>
                    <button className="bg-primary-800 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded flex items-center transition duration-200">
                      Shop now
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 ml-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="relative flex items-center justify-end">
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
                    <div className="text-right">
                      <h3 className="text-4xl font-bold text-gray-800">
                        Get the
                      </h3>
                      <h3 className="text-5xl font-bold italic text-blue-600">
                        freshest lineup
                      </h3>
                      <p className="text-xl text-gray-800 mt-2">
                        on your favorite
                      </p>
                      <p className="text-xl text-gray-800">personal care</p>
                      <p className="text-xl text-gray-800">products.</p>
                    </div>
                  </div>
                </div>
                <img
                  src="https://www.unilever.com/Images/dove-beauty-bar-purely-pampering_tcm244-408569_w1200.jpg"
                  alt="Personal care products"
                  className="absolute right-0 h-80 object-contain"
                />
              </div>

              {/* Navigation Arrows */}
              <button className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-neutral-800 rounded-full p-3 shadow-md hover:bg-neutral-700 transition duration-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-neutral-800 rounded-full p-3 shadow-md hover:bg-neutral-700 transition duration-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Products Slider */}
        <div className="container mx-auto px-4 py-6 bg-neutral-900">
          <div className="flex overflow-x-auto space-x-4 pb-4">
            <div className="bg-neutral-800 border border-neutral-700 rounded-lg shadow-sm hover:shadow-md transition duration-200 min-w-[230px] flex-shrink-0">
              <div className="p-4 flex items-center justify-center">
                <img
                  src="https://m.media-amazon.com/images/I/61WQqrGxxpL.jpg"
                  alt="AXE Phoenix Deodorant"
                  className="h-32 object-contain"
                />
              </div>
              <div className="p-4 border-t border-neutral-700">
                <h3 className="font-medium text-neutral-100">AXE Phoenix...</h3>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex flex-col">
                    <span className="text-primary-800 font-bold">$5.00</span>
                    <span className="text-gray-500 text-sm line-through">
                      $6.59
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-neutral-800 border border-neutral-700 rounded-lg shadow-sm hover:shadow-md transition duration-200 min-w-[230px] flex-shrink-0">
              <div className="p-4 flex items-center justify-center">
                <img
                  src="https://m.media-amazon.com/images/I/71BOiInOc2L.jpg"
                  alt="Degree Ultra Clear"
                  className="h-32 object-contain"
                />
              </div>
              <div className="p-4 border-t border-neutral-700">
                <h3 className="font-medium text-neutral-100">
                  Degree Ultra Clear...
                </h3>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex flex-col">
                    <span className="text-primary-800 font-bold">$6.69</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-neutral-800 border border-neutral-700 rounded-lg shadow-sm hover:shadow-md transition duration-200 min-w-[230px] flex-shrink-0">
              <div className="p-4 flex items-center justify-center">
                <img
                  src="https://m.media-amazon.com/images/I/71PEFQc7GPL.jpg"
                  alt="Dove Deep Moisture"
                  className="h-32 object-contain"
                />
              </div>
              <div className="p-4 border-t border-neutral-700">
                <h3 className="font-medium text-neutral-100">
                  Dove Deep Moistur...
                </h3>
                <div className="flex justify-between items-center mt-2">
                  <div className="flex flex-col">
                    <span className="text-primary-800 font-bold">$7.99</span>
                    <span className="text-gray-500 text-sm line-through">
                      $11.39
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Next: "Add more product cards" */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;