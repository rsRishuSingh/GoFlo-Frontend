import React from "react";
import "remixicon/fonts/remixicon.css";

const HelpButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="absolute top-[3%] right-3 z-10 bg-white text-black h-12 pl-2 pr-4 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)] flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border border-gray-100 hover:shadow-lg"
      title="Request help from nearby users"
    >
      <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-5 w-5 fill-[#ff1e00]"
        >
          <path d="M16 1C16.5523 1 17 1.44772 17 2V5H21C21.5523 5 22 5.44772 22 6V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V6C2 5.44772 2.44772 5 3 5H7V2C7 1.44772 7.44772 1 8 1H16ZM20 7H4V19H20V7ZM13 9V12H16V14H12.999L13 17H11L10.999 14H8V12H11V9H13ZM15 3H9V5H15V3Z"></path>
        </svg>
      </div>

      <span className="text-[13px] font-bold tracking-tight">Help</span>
    </button>
  );
};

export default HelpButton;
