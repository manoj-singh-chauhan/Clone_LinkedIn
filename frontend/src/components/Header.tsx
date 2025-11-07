import React from "react";
import { IoHome } from "react-icons/io5";
import { BsFillPeopleFill } from "react-icons/bs";
import { FaShoppingBag, FaSearch, FaTh } from "react-icons/fa";
import { AiFillMessage } from "react-icons/ai";
import { IoMdNotifications } from "react-icons/io";
import { Link } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
// import { useAuth } from "../context/AuthContext";


const Header: React.FC = () => {
  // const { user } = useAuth();
  return (
    <header className="bg-white border-b shadow-sm h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 md:px-10 sticky top-0 z-50">
      <div className="flex items-center space-x-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 34 34"
          className="w-8 h-8"
        >
          <g>
            <rect width="34" height="34" fill="#0A66C2" rx="4" />
            <path
              d="M8.1,13H12v13H8.1V13Zm1.95-6.48a2.25,2.25,0,1,1,0,4.5,2.25,2.25,0,0,1,0-4.5"
              fill="#fff"
            />
            <path
              d="M14,13h3.7v1.78h.05a4.06,4.06,0,0,1,3.64-2c3.89,0,4.6,2.56,4.6,5.88V26H22V19.77c0-1.49,0-3.41-2.08-3.41s-2.39,1.62-2.39,3.29V26H14Z"
              fill="#fff"
            />
          </g>
        </svg>

        <div className="relative hidden sm:flex items-center w-48 md:w-64 lg:w-68">
          <FaSearch className="absolute left-3 text-gray-500 text-sm" />
          <input
            type="text"
            placeholder="Search"
            className="pl-9 pr-3 py-1.5 rounded-md bg-gray-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
          />
        </div>
      </div>
      
      
      <nav className="flex space-x-4 md:space-x-10 text-gray-600">
        <Link
          to="/home"
          className="flex flex-col items-center hover:text-blue-600"
        >
          <IoHome size={18} />
          <span className="text-xs hidden md:block">Home</span>
        </Link>
        <Link
          to="/network"
          className="flex flex-col items-center hover:text-blue-600"
        >
          <BsFillPeopleFill size={18} />
          <span className="text-xs hidden md:block">My Network</span>
        </Link>
        <Link
          to="/jobs"
          className="flex flex-col items-center hover:text-blue-600"
        >
          <FaShoppingBag size={18} />
          <span className="text-xs hidden md:block">Jobs</span>
        </Link>
        <Link
          to="/messaging"
          className="flex flex-col items-center hover:text-blue-600"
        >
          <AiFillMessage size={18} />
          <span className="text-xs hidden md:block">Messaging</span>
        </Link>
        <Link
          to="/notifications"
          className="flex flex-col items-center hover:text-blue-600"
        >
          <IoMdNotifications size={18} />
          <span className="text-xs hidden md:block">Notifications</span>
        </Link>
      </nav>
      <div className="flex items-center space-x-6">
        <ProfileMenu/>

        <div className="flex flex-col items-center justify-center cursor-pointer hover:text-blue-600 mt-2">
          <FaTh size={22} />
          <span className="text-xs hidden md:block">Work</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
