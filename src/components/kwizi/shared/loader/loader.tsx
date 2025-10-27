import React from "react";

function Loader() {
  return (
    <div className="fixed left-0 top-0 w-full h-full z-20 flex items-center justify-center pointer-events-none">
      <div className="loader"></div>
    </div>
  );
}

export default Loader;
