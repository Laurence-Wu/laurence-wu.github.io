import React, { useState } from "react";
import "../styles/Search.css";

const Search = () => {
  const [showSearchBox, setShowSearchBox] = useState(false);

  const handleSearchClick = () => {
    setShowSearchBox(!showSearchBox);
  };

  return (
    <div className="search-container">
      <button onClick={handleSearchClick} className="search-icon">
        🔍
      </button>
      {showSearchBox && (
        <input
          type="text"
          className="search-box"
          placeholder="find more about me"
        />
      )}
    </div>
  );
};

export default Search;
